import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimit.middleware.js';
import {
  orgRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/schemas.js';

const r = Router();

r.post('/org/register-otp', authLimiter, validateBody(orgRegisterSchema), asyncHandler(auth.registerOrgOtp));
r.post('/org/verify-otp', authLimiter, asyncHandler(auth.verifyOrgOtp));
r.post('/org/login', authLimiter, validateBody(loginSchema), asyncHandler(auth.loginOrg));
r.post('/member/login', authLimiter, validateBody(loginSchema), asyncHandler(auth.loginMember));
r.post('/refresh', apiLimiter, asyncHandler(auth.refreshTokens));
r.post('/logout', apiLimiter, asyncHandler(auth.logout));
r.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), asyncHandler(auth.forgotPassword));
r.post('/reset-password/:token', authLimiter, validateBody(resetPasswordSchema), asyncHandler(auth.resetPassword));
r.get('/me', verifyToken, asyncHandler(auth.me));

export default r;
