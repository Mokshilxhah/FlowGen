import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/org.controller.js';

const r = Router();
r.use(verifyToken, requireRole(ROLES.ORG_ADMIN));

r.get('/profile', asyncHandler(c.getProfile));
r.patch('/profile', asyncHandler(c.patchProfile));
r.get('/stats', asyncHandler(c.getStats));
r.get('/activity', asyncHandler(c.getActivity));
r.get('/billing', asyncHandler(c.getBilling));
r.patch('/billing/upgrade', asyncHandler(c.upgradeBilling));

export default r;
