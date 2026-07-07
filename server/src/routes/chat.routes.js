import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { upload } from '../middleware/upload.middleware.js';
import * as c from '../controllers/chat.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/rooms', asyncHandler(c.listRooms));
r.post('/rooms', asyncHandler(c.createRoom));
r.post('/rooms/:id/messages', asyncHandler(c.postRoomMessage));
r.post('/rooms/:id/messages/file', upload.single('file'), asyncHandler(c.postRoomFileMessage));
r.get('/rooms/:id/messages', asyncHandler(c.listRoomMessages));
r.delete('/rooms/:id', asyncHandler(c.archiveRoom));

export default r;
