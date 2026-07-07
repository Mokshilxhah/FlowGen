import express from 'express';
import {
  sendAIMessage,
  getAIChatHistory,
  getTaskSuggestions,
  estimateTaskDuration,
  suggestMeetingTime,
  generateMeetingAgenda,
  getProductivityForecast,
  checkAIHealth,
} from '../controllers/ai.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requirePro } from '../middleware/plan.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All AI routes require authentication and a Pro/Enterprise plan
router.use(verifyToken);
router.use(requirePro);

// AI Chat
router.post('/chat/message', asyncHandler(sendAIMessage));
router.get('/chat/history/:sessionId', asyncHandler(getAIChatHistory));

// AI Task Intelligence
router.post('/tasks/suggest-assignee', asyncHandler(getTaskSuggestions));
router.post('/tasks/estimate-duration', asyncHandler(estimateTaskDuration));

// AI Meeting Intelligence
router.post('/meetings/suggest-time', asyncHandler(suggestMeetingTime));
router.post('/meetings/generate-agenda', asyncHandler(generateMeetingAgenda));

// AI Analytics
router.get('/analytics/productivity-forecast', asyncHandler(getProductivityForecast));

// Health check
router.get('/health', asyncHandler(checkAIHealth));

export default router;
