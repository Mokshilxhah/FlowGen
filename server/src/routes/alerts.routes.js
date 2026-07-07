import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { alertCreateSchema } from '../validators/schemas.js';
import * as c from '../controllers/alerts.controller.js';

const r = Router();
r.use(verifyToken, requireRole(ROLES.HR, ROLES.ORG_ADMIN));

r.get('/', asyncHandler(c.listAlerts));
r.post('/', validateBody(alertCreateSchema), asyncHandler(c.createAlert));
r.patch('/:id', asyncHandler(c.updateAlert));
r.delete('/:id', asyncHandler(c.deleteAlert));

export default r;
