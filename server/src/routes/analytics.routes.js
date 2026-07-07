import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/analytics.controller.js';

const r = Router();
r.use(verifyToken, requireRole(ROLES.ORG_ADMIN, ROLES.HR));

r.get('/overview', asyncHandler(c.getOverview));

export default r;
