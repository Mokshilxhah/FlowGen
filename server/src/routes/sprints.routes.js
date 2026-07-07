import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requirePro } from '../middleware/plan.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/sprints.controller.js';

const r = Router();
r.use(verifyToken);
r.use(requirePro);

r.get('/', asyncHandler(c.listSprints));
r.post('/', asyncHandler(c.createSprint));
r.patch('/:id/complete', asyncHandler(c.completeSprint));
r.get('/:id/burndown', asyncHandler(c.burndown));
r.patch('/:id', asyncHandler(c.updateSprint));

export default r;
