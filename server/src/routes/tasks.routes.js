import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { taskCreateSchema, taskUpdateSchema } from '../validators/schemas.js';
import * as c from '../controllers/tasks.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listTasks));
r.post('/', validateBody(taskCreateSchema), asyncHandler(c.createTask));
r.get('/:id', asyncHandler(c.getTask));
r.patch('/:id/status', asyncHandler(c.patchStatus));
r.patch('/:id/position', asyncHandler(c.updatePosition));
r.post('/:id/comments', asyncHandler(c.addComment));
r.patch('/:id/comments/:cid', asyncHandler(c.updateComment));
r.delete('/:id/comments/:cid', asyncHandler(c.deleteComment));
r.post('/:id/subtasks', asyncHandler(c.addSubtask));
r.patch('/:id/subtasks/:sid', asyncHandler(c.toggleSubtask));
r.post('/:id/time-log', asyncHandler(c.timeLog));
r.patch('/:id', validateBody(taskUpdateSchema), asyncHandler(c.updateTask));
r.delete('/:id', asyncHandler(c.deleteTask));

export default r;
