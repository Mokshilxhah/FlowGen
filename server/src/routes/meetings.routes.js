import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { meetingCreateSchema } from '../validators/schemas.js';
import * as c from '../controllers/meetings.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listMeetings));
r.post('/', validateBody(meetingCreateSchema), asyncHandler(c.createMeeting));
r.get('/:id', asyncHandler(c.getMeeting));
r.patch('/:id', asyncHandler(c.updateMeeting));
r.delete('/:id', asyncHandler(c.cancelMeeting));
r.post('/:id/notes', asyncHandler(c.addNotes));

export default r;
