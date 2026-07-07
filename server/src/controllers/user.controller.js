import User from '../models/User.js';
import { hashPassword, comparePassword } from '../services/authService.js';
import { AppError } from '../utils/AppError.js';
import { USER_STATUS } from '../config/constants.js';

/** Same-org users for inbox / compose / @mentions */
export async function listPeers(req, res) {
  const users = await User.find({
    orgId: req.orgId,
    status: USER_STATUS.ACTIVE,
    _id: { $ne: req.user._id },
  })
    .select('name avatar companyEmail role designation status')
    .sort({ name: 1 })
    .limit(500);
  res.json({ data: users.map((u) => u.toJSON()) });
}

export async function patchProfile(req, res) {
  const u = await User.findById(req.user._id);
  const { name, bio, timezone, avatar, phone, personalEmail } = req.body;
  if (name) u.name = name;
  if (bio !== undefined) u.bio = bio;
  if (timezone) u.timezone = timezone;
  if (avatar !== undefined) u.avatar = avatar;
  if (phone !== undefined) u.phone = phone;
  if (personalEmail !== undefined) u.personalEmail = personalEmail;
  await u.save();
  res.json({ data: u.toJSON() });
}

export async function patchPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const u = await User.findById(req.user._id).select('+password');
  if (!(await comparePassword(currentPassword, u.password))) {
    throw new AppError('Current password incorrect', 400);
  }
  u.password = await hashPassword(newPassword);
  u.refreshTokenHash = null;
  await u.save();
  res.json({ data: { message: 'Password updated' } });
}

export async function patchPreferences(req, res) {
  const u = await User.findById(req.user._id);
  if (req.body.theme) u.preferences.theme = req.body.theme;
  if (req.body.notifications) {
    u.preferences.notifications = { ...u.preferences.notifications, ...req.body.notifications };
  }
  await u.save();
  res.json({ data: u.toJSON() });
}

export async function uploadAvatar(req, res) {
  if (!req.file) throw new AppError('No file', 400);
  const url = `/uploads/${req.file.filename}`;
  const u = await User.findById(req.user._id);
  u.avatar = url;
  await u.save();
  res.json({ data: { avatar: url, user: u.toJSON() } });
}

export async function setup2FA(req, res) {
  res.status(501).json({ error: '2FA setup not enabled in Phase 2' });
}

export async function verify2FA(req, res) {
  res.status(501).json({ error: '2FA verify not enabled in Phase 2' });
}

export async function disable2FA(req, res) {
  const u = await User.findById(req.user._id);
  u.twoFactorEnabled = false;
  u.twoFactorSecret = null;
  await u.save();
  res.json({ data: { ok: true } });
}
