import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { memberCreateSchema, memberUpdateSchema } from '../validators/schemas.js';
import * as c from '../controllers/members.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.listMembers));
r.get('/:id', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.getMember));

r.post('/', requireRole(ROLES.ORG_ADMIN, ROLES.HR), validateBody(memberCreateSchema), asyncHandler(c.addMember));
r.patch('/:id', requireRole(ROLES.ORG_ADMIN, ROLES.HR), validateBody(memberUpdateSchema), asyncHandler(c.updateMember));
r.delete('/:id', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.deactivateMember));
r.post('/:id/resend-invite', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.resendInvite));
r.patch('/:id/reset-password', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.resetMemberPassword));
r.patch('/:id/toggle-status', requireRole(ROLES.ORG_ADMIN, ROLES.HR), asyncHandler(c.toggleMemberStatus));

export default r;
