import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { hashToken } from '../utils/tokenHash.js';

const SALT = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), orgId: user.orgId.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), orgId: user.orgId.toString(), role: user.role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function hashRefreshTokenForStore(token) {
  return hashToken(token);
}
