import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/learning.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/progress', asyncHandler(c.getProgress));
r.post('/courses', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.addCourse));
r.patch('/courses/:id', asyncHandler(c.updateCourse));
r.get('/skills', asyncHandler(c.getSkills));
r.patch('/skills', asyncHandler(c.updateSkills));
r.get('/mentor', asyncHandler(c.getMentor));

r.get('/progress/all', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.listAllProgress));
r.patch('/mentor/assign', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.assignMentor));

export default r;
