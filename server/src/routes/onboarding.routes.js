import express from 'express';
import { completeOnboarding, inviteMember, getOnboardingStatus } from '../controllers/onboarding.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public route - organization registration
router.post('/register', asyncHandler(completeOnboarding));

// Protected routes
router.use(verifyToken);

// Invite member (org admin or HR only)
router.post('/invite', requireRole([ROLES.ORG_ADMIN, ROLES.HR]), asyncHandler(inviteMember));

// Get onboarding status
router.get('/status', asyncHandler(getOnboardingStatus));

export default router;
