import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { upload } from '../middleware/upload.middleware.js';
import * as c from '../controllers/resources.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/', asyncHandler(c.listResources));
r.post('/', upload.single('file'), asyncHandler(c.createResource));
r.get('/download/:id', asyncHandler(c.downloadResource));
r.get('/:id', asyncHandler(c.getResource));
r.patch('/:id', asyncHandler(c.updateResource));
r.delete('/:id', asyncHandler(c.deleteResource));
r.post('/:id/comments', asyncHandler(c.addResourceComment));

export default r;
