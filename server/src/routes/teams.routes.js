import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/teams.controller.js';

const r = Router();
r.use(verifyToken, requireRole(ROLES.ORG_ADMIN, ROLES.HR));

r.get('/', asyncHandler(c.listTeams));
r.post('/', asyncHandler(c.createTeam));
r.get('/:id', asyncHandler(c.getTeam));
r.patch('/:id', asyncHandler(c.updateTeam));
r.delete('/:id', asyncHandler(c.deleteTeam));
r.get('/:id/report', asyncHandler(c.teamReport));

export default r;
