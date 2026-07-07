import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { messageCreateSchema } from '../validators/schemas.js';
import * as c from '../controllers/messages.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listMessages));
r.post('/', validateBody(messageCreateSchema), asyncHandler(c.sendMessage));
r.get('/unread-count', asyncHandler(c.unreadCount));
r.get('/:id', asyncHandler(c.getMessage));
r.delete('/:id', asyncHandler(c.deleteMessage));
r.patch('/:id/star', asyncHandler(c.starMessage));

export default r;
