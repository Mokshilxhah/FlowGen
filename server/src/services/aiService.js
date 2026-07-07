import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send message to AI chatbot
   */
  async sendChatMessage(message, userId, organizationId, sessionId = null) {
    try {
      const response = await this.client.post('/api/ai/chat/message', {
        message,
        userId,
        organizationId,
        sessionId,
      });
      return response.data;
    } catch (error) {
      console.error('AI Chat Service Error:', error.message);
      // Return fallback response
      return {
        response: "I'm currently unavailable. Please try again later.",
        intent: 'error',
        confidence: 0,
      };
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId) {
    try {
      const response = await this.client.get(`/api/ai/chat/history/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('AI Chat History Error:', error.message);
      return { messages: [] };
    }
  }

  /**
   * Suggest task assignee using ML
   */
  async suggestTaskAssignee(taskData) {
    try {
      const response = await this.client.post('/api/ai/tasks/suggest-assignee', taskData);
      return response.data;
    } catch (error) {
      console.error('AI Task Suggester Error:', error.message);
      return null;
    }
  }

  /**
   * Estimate task duration
   */
  async estimateTaskDuration(taskData) {
    try {
      const response = await this.client.post('/api/ai/tasks/estimate-duration', taskData);
      return response.data;
    } catch (error) {
      console.error('AI Duration Estimator Error:', error.message);
      return null;
    }
  }

  /**
   * Suggest optimal meeting time
   */
  async suggestMeetingTime(meetingData) {
    try {
      const response = await this.client.post('/api/ai/meetings/suggest-time', meetingData);
      return response.data;
    } catch (error) {
      console.error('AI Meeting Scheduler Error:', error.message);
      return null;
    }
  }

  /**
   * Generate meeting agenda
   */
  async generateMeetingAgenda(meetingData) {
    try {
      const response = await this.client.post('/api/ai/meetings/generate-agenda', meetingData);
      return response.data;
    } catch (error) {
      console.error('AI Agenda Generator Error:', error.message);
      return null;
    }
  }

  /**
   * Get productivity forecast
   */
  async getProductivityForecast(userId, days = 30) {
    try {
      const response = await this.client.get(`/api/ai/analytics/productivity-forecast`, {
        params: { userId, days },
      });
      return response.data;
    } catch (error) {
      console.error('AI Productivity Forecast Error:', error.message);
      return null;
    }
  }

  /**
   * Check if AI service is available
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default new AIService();
