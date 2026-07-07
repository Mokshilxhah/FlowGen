import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/notifications.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listNotifications));
r.get('/unread-count', asyncHandler(c.unreadCount));
r.patch('/:id/read', asyncHandler(c.markRead));
r.patch('/read-all', asyncHandler(c.markAllRead));
r.delete('/all', asyncHandler(c.deleteAll));
r.delete('/:id', asyncHandler(c.deleteNotification));

export default r;
