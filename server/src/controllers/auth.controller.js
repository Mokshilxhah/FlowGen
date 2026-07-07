import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OTPVerification from '../models/OTPVerification.js';
import { ROLES, USER_STATUS, COOKIE_REFRESH } from '../config/constants.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshTokenForStore,
} from '../services/authService.js';
import { hashToken } from '../utils/tokenHash.js';
import { sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } from '../services/emailService.js';
import { AppError } from '../utils/AppError.js';

function setRefreshCookie(res, token) {
  res.cookie(COOKIE_REFRESH, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_REFRESH, { path: '/', sameSite: 'none' });
}

export async function registerOrgOtp(req, res) {
  const { 
    orgName, domain, industry, plan, adminName, adminEmail, adminPassword,
    address, city, country, phone, taxId 
  } = req.body;
  const d = domain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const exists = await Organization.findOne({ domain: d });
  if (exists) throw new AppError('Domain already registered', 409);

  const userExists = await User.findOne({
    $or: [{ personalEmail: adminEmail.toLowerCase() }, { companyEmail: adminEmail.toLowerCase() }]
  });
  if (userExists) throw new AppError('Email already registered', 409);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = await hashPassword(adminPassword);

  const payload = {
    orgName,
    domain: d,
    industry: industry || 'Technology',
    plan: plan || 'free',
    adminName,
    adminEmail: adminEmail.toLowerCase(),
    adminPassword: hashed,
    address,
    city,
    country,
    phone,
    taxId,
  };

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OTPVerification.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    { otp, attempts: 0, registrationPayload: payload, expiresAt },
    { upsert: true, new: true }
  );

  await sendOTPEmail(adminEmail.toLowerCase(), otp);

  res.json({ data: { message: 'Verification OTP sent to your email.' } });
}

export async function verifyOrgOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Email and OTP are required', 400);

  const verification = await OTPVerification.findOne({ email: email.toLowerCase() });
  if (!verification) {
    throw new AppError('Verification code expired or not found. Please request a new one.', 400);
  }

  verification.attempts += 1;

  if (verification.otp !== otp.trim()) {
    if (verification.attempts >= 3) {
      await verification.deleteOne();
      throw new AppError('Too many failed attempts. Please request a new verification code.', 400);
    }
    await verification.save();
    throw new AppError(`Invalid verification code. You have ${3 - verification.attempts} attempts remaining.`, 400);
  }

  const payload = verification.registrationPayload;

  const org = await Organization.create({
    name: payload.orgName,
    domain: payload.domain,
    industry: payload.industry,
    plan: payload.plan,
    address: payload.address,
    city: payload.city,
    country: payload.country,
    phone: payload.phone,
    taxId: payload.taxId,
  });

  const companyEmail = `${payload.adminName.split(' ')[0].toLowerCase()}.${payload.adminName.split(' ')[1]?.toLowerCase() || 'admin'}@${payload.domain}.flowgen.app`;

  const admin = await User.create({
    orgId: org._id,
    name: payload.adminName,
    personalEmail: payload.adminEmail,
    companyEmail,
    password: payload.adminPassword,
    role: ROLES.ORG_ADMIN,
    status: USER_STATUS.ACTIVE,
    department: 'Executive',
    designation: 'Organization Admin',
  });

  org.adminId = admin._id;
  await org.save();

  await verification.deleteOne();

  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);
  admin.refreshTokenHash = hashRefreshTokenForStore(refreshToken);
  await admin.save();

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    data: {
      user: admin.toJSON(),
      organization: org.toJSON(),
      accessToken,
    },
  });
}

export async function loginOrg(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({
    $or: [{ personalEmail: email.toLowerCase() }, { companyEmail: email.toLowerCase() }],
    role: ROLES.ORG_ADMIN,
  }).select('+password +refreshTokenHash');

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError('Account not active', 403);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashRefreshTokenForStore(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  setRefreshCookie(res, refreshToken);

  const org = await Organization.findById(user.orgId);

  res.json({ data: { user: user.toJSON(), organization: org ? org.toJSON() : null, accessToken } });
}

export async function loginMember(req, res) {
  const { email, password } = req.body;
  const e = email.toLowerCase();
  const user = await User.findOne({
    $or: [{ companyEmail: e }, { personalEmail: e }],
    role: { $in: [ROLES.HR, ROLES.EMPLOYEE, ROLES.INTERN] },
  }).select('+password +refreshTokenHash');

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError('Account not active', 403);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashRefreshTokenForStore(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  setRefreshCookie(res, refreshToken);

  const org = await Organization.findById(user.orgId);

  res.json({ data: { user: user.toJSON(), organization: org ? org.toJSON() : null, accessToken } });
}

export async function refreshTokens(req, res) {
  const token = req.cookies[COOKIE_REFRESH];
  if (!token) throw new AppError('No refresh token', 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(payload.userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new AppError('Unauthorized', 401);

  const incomingHash = hashRefreshTokenForStore(token);
  if (incomingHash !== user.refreshTokenHash) throw new AppError('Unauthorized', 401);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashRefreshTokenForStore(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.json({ data: { accessToken, user: user.toJSON() } });
}

export async function logout(req, res) {
  const token = req.cookies[COOKIE_REFRESH];
  if (token) {
    try {
      const p = verifyRefreshToken(token);
      await User.findByIdAndUpdate(p.userId, { $unset: { refreshTokenHash: 1 } });
    } catch {
      /* ignore */
    }
  }
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
  }
  clearRefreshCookie(res);
  res.json({ data: { ok: true } });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({
    $or: [{ personalEmail: email.toLowerCase() }, { companyEmail: email.toLowerCase() }],
  });
  if (!user) {
    return res.json({ data: { message: 'If an account exists, email was sent' } });
  }
  const plain = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashToken(plain);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await sendPasswordResetEmail(user, plain);
  res.json({ data: { message: 'If an account exists, email was sent' } });
}

export async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;
  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) throw new AppError('Invalid or expired token', 400);

  user.password = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokenHash = null;
  await user.save();

  res.json({ data: { message: 'Password updated' } });
}

export async function me(req, res) {
  const user = await User.findById(req.user._id).populate('orgId');
  const orgDoc = user.orgId;
  const organization =
    orgDoc && typeof orgDoc.toJSON === 'function' ? orgDoc.toJSON() : orgDoc || null;
  res.json({ data: { user: user.toJSON(), organization } });
}
