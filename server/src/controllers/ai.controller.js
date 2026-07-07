import aiService from '../services/aiService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Send message to AI chatbot
 */
export const sendAIMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const userId = req.user._id.toString();
    const organizationId = req.user.orgId.toString();

    const aiResponse = await aiService.sendChatMessage(
      message,
      userId,
      organizationId,
      sessionId
    );

    res.json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI chat history
 */
export const getAIChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const history = await aiService.getChatHistory(sessionId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI task suggestions
 */
export const getTaskSuggestions = async (req, res, next) => {
  try {
    const { taskTitle, taskDescription, projectId } = req.body;

    if (!taskTitle) {
      throw new AppError('Task title is required', 400);
    }

    const organizationId = req.user.orgId.toString();

    const suggestions = await aiService.suggestTaskAssignee({
      taskTitle,
      taskDescription,
      projectId,
      organizationId,
    });

    res.json({
      success: true,
      data: suggestions || { suggestions: [] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Estimate task duration
 */
export const estimateTaskDuration = async (req, res, next) => {
  try {
    const { taskTitle, taskDescription, complexity } = req.body;

    if (!taskTitle) {
      throw new AppError('Task title is required', 400);
    }

    const estimate = await aiService.estimateTaskDuration({
      taskTitle,
      taskDescription,
      complexity,
    });

    res.json({
      success: true,
      data: estimate || { estimatedHours: null },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest meeting time
 */
export const suggestMeetingTime = async (req, res, next) => {
  try {
    const { participants, duration, dateRange } = req.body;

    if (!participants || !duration) {
      throw new AppError('Participants and duration are required', 400);
    }

    const suggestions = await aiService.suggestMeetingTime({
      participants,
      duration,
      dateRange,
    });

    res.json({
      success: true,
      data: suggestions || { suggestions: [] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate meeting agenda
 */
export const generateMeetingAgenda = async (req, res, next) => {
  try {
    const { title, participants, duration, topics } = req.body;

    if (!title) {
      throw new AppError('Meeting title is required', 400);
    }

    const agenda = await aiService.generateMeetingAgenda({
      title,
      participants,
      duration,
      topics,
    });

    res.json({
      success: true,
      data: agenda || { agenda: [] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get productivity forecast
 */
export const getProductivityForecast = async (req, res, next) => {
  try {
    const { userId, days } = req.query;
    const targetUserId = userId || req.user._id.toString();

    const forecast = await aiService.getProductivityForecast(targetUserId, days);

    res.json({
      success: true,
      data: forecast || { forecast: [], trend: 'stable' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check AI service health
 */
export const checkAIHealth = async (req, res, next) => {
  try {
    const isHealthy = await aiService.healthCheck();

    res.json({
      success: true,
      data: {
        aiServiceAvailable: isHealthy,
        status: isHealthy ? 'online' : 'offline',
      },
    });
  } catch (error) {
    next(error);
  }
};
