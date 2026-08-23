import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { hashPassword } from '../services/authService.js';
import { generateCompanyEmail } from '../utils/generateCompanyEmail.js';
import { generateSecurePassword } from '../utils/generatePassword.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from '../services/activityFeedService.js';

async function bumpOrgCounts(orgId) {
  const org = await Organization.findById(orgId);
  if (!org) return;
  const [hr, employees, interns] = await Promise.all([
    User.countDocuments({ orgId, role: ROLES.HR, status: { $ne: USER_STATUS.DEACTIVATED } }),
    User.countDocuments({ orgId, role: ROLES.EMPLOYEE, status: { $ne: USER_STATUS.DEACTIVATED } }),
    User.countDocuments({ orgId, role: ROLES.INTERN, status: { $ne: USER_STATUS.DEACTIVATED } }),
  ]);
  org.membersCount = { hr, employees, interns };
  await org.save();
}

export async function listMembers(req, res) {
  const { role, status } = req.query;
  const filter = { orgId: req.orgId };
  if (role) filter.role = role;
  if (status) filter.status = status;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ data: users.map((u) => u.toJSON()) });
}

export async function addMember(req, res) {
  const {
    role,
    name,
    personalEmail,
    phone,
    department,
    designation,
    joinDate,
    managerId,
    teamId,
  } = req.body;

  const org = await Organization.findById(req.orgId);
  if (!org) throw new AppError('Org not found', 404);

  // Enforce 5-member limit on Free plan (excluding org_admin)
  if (org.plan === 'free') {
    const totalActiveWorkforceCount = await User.countDocuments({
      orgId: req.orgId,
      role: { $ne: ROLES.ORG_ADMIN },
      status: { $ne: USER_STATUS.DEACTIVATED }
    });
    if (totalActiveWorkforceCount >= 5) {
      throw new AppError('Headcount limit reached. Organizations on the Free plan are limited to a maximum of 5 workforce members. Please upgrade to Pro to add more members.', 403);
    }
  }

  const parts = name.trim().split(/\s+/);
  const first = parts[0] || 'user';
  const last = parts.slice(1).join(' ') || 'member';
  let companyEmail = generateCompanyEmail(first, last, org.domain);
  let suffix = 1;
  while (await User.findOne({ companyEmail })) {
    companyEmail = generateCompanyEmail(`${first}${suffix}`, last, org.domain);
    suffix++;
  }

  const tempPassword = generateSecurePassword(14);
  const hashed = await hashPassword(tempPassword);
  const inviteToken = uuidv4();
  const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const user = await User.create({
    orgId: req.orgId,
    name,
    personalEmail: personalEmail.toLowerCase(),
    companyEmail,
    password: hashed,
    role,
    phone,
    department,
    designation,
    joinDate: joinDate || new Date(),
    managerId: managerId || (req.user.role === ROLES.HR ? req.user._id : null),
    teamId: teamId || null,
    status: USER_STATUS.ACTIVE,
    inviteToken,
    inviteTokenExpiry,
  });

  await bumpOrgCounts(req.orgId);
  await sendWelcomeEmail(user, org, role, tempPassword);
  await logActivity(req.orgId, {
    type: 'member_added',
    message: `${name} was added as ${role}`,
    userId: user._id,
    color: 'accent-emerald',
  });

  res.status(201).json({ data: { user: user.toJSON(), tempPassword } });
}

export async function getMember(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);
  res.json({ data: user.toJSON() });
}

export async function updateMember(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);

  const updates = { ...req.body };
  let tempPassword = null;

  if (updates.password) {
    tempPassword = updates.password;
    updates.password = await hashPassword(updates.password);
    updates.refreshTokenHash = null;
  }

  delete updates.resendCredentials;

  Object.assign(user, updates);
  await user.save();
  await bumpOrgCounts(req.orgId);

  if (req.body.resendCredentials && tempPassword) {
    const org = await Organization.findById(req.orgId);
    await sendWelcomeEmail(user, org, user.role, tempPassword);
  }

  res.json({ data: user.toJSON() });
}

export async function deactivateMember(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);
  if (user.role === ROLES.ORG_ADMIN) throw new AppError('Cannot remove org admin', 400);
  user.status = USER_STATUS.DEACTIVATED;
  user.refreshTokenHash = null;
  await user.save();
  await bumpOrgCounts(req.orgId);
  res.json({ data: { ok: true } });
}

export async function resendInvite(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);
  const org = await Organization.findById(req.orgId);
  const tempPassword = generateSecurePassword(14);
  user.password = await hashPassword(tempPassword);
  await user.save();
  await sendWelcomeEmail(user, org, user.role, tempPassword);
  res.json({ data: { message: 'Invite email sent' } });
}

export async function resetMemberPassword(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);
  const tempPassword = generateSecurePassword(14);
  user.password = await hashPassword(tempPassword);
  user.refreshTokenHash = null;
  await user.save();
  const org = await Organization.findById(req.orgId);
  await sendWelcomeEmail(user, org, user.role, tempPassword);
  res.json({ data: { message: 'Password reset email sent' } });
}

export async function toggleMemberStatus(req, res) {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!user) throw new AppError('Not found', 404);
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) throw new AppError('Invalid status', 400);
  user.status = status;
  if (status === 'suspended') user.refreshTokenHash = null;
  await user.save();
  await bumpOrgCounts(req.orgId);
  res.json({ data: user.toJSON() });
}
