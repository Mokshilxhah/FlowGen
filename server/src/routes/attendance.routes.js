import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requirePro } from '../middleware/plan.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/attendance.controller.js';

const r = Router();
r.use(verifyToken);
r.use(requirePro);

r.post('/', asyncHandler(c.checkIn));
r.patch('/:id/checkout', asyncHandler(c.checkOut));
r.get('/report', requireRole(ROLES.HR, ROLES.ORG_ADMIN), asyncHandler(c.attendanceReport));
r.patch('/:id', requireRole(ROLES.HR, ROLES.ORG_ADMIN), asyncHandler(c.patchAttendance));
r.get('/', requireRole(ROLES.HR, ROLES.ORG_ADMIN), asyncHandler(c.listAttendance));

export default r;
