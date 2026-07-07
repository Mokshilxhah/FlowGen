import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { projectCreateSchema } from '../validators/schemas.js';
import * as c from '../controllers/projects.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listProjects));
r.post('/', requireRole(ROLES.ORG_ADMIN), validateBody(projectCreateSchema), asyncHandler(c.createProject));
r.get('/:id', asyncHandler(c.getProject));
r.patch('/:id', asyncHandler(c.updateProject));
r.delete('/:id', requireRole(ROLES.ORG_ADMIN), asyncHandler(c.deleteProject));
r.get('/:id/stats', asyncHandler(c.projectStats));
r.post('/:id/milestones', asyncHandler(c.addMilestone));
r.patch('/:id/milestones/:mid', asyncHandler(c.updateMilestone));

export default r;
