import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema, changePasswordSchema, preferencesSchema } from '../validators/schemas.js';
import { upload } from '../middleware/upload.middleware.js';
import * as c from '../controllers/user.controller.js';

const r = Router();
r.use(verifyToken);

r.get('/peers', asyncHandler(c.listPeers));
r.patch('/profile', validateBody(updateProfileSchema), asyncHandler(c.patchProfile));
r.patch('/password', validateBody(changePasswordSchema), asyncHandler(c.patchPassword));
r.patch('/preferences', validateBody(preferencesSchema), asyncHandler(c.patchPreferences));
r.post('/avatar', upload.single('avatar'), asyncHandler(c.uploadAvatar));
r.post('/2fa/setup', asyncHandler(c.setup2FA));
r.post('/2fa/verify', asyncHandler(c.verify2FA));
r.delete('/2fa', asyncHandler(c.disable2FA));

export default r;
