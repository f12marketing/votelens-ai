import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getChatAIService } from '../services/chat-ai.service';

export class ChatController extends BaseController {
  private chatService = getChatAIService();

  /**
   * Process chat query
   */
  async processQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, conversationId, context } = req.body;

      if (!query) {
        return this.error(res, 'MISSING_DATA', 'Query is required', 400);
      }

      const result = await this.chatService.processQuery({
        query,
        conversationId,
        context,
      });

      return this.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process chat query with AI enhancement
   */
  async processQueryWithAI(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, conversationId, context } = req.body;

      if (!query) {
        return this.error(res, 'MISSING_DATA', 'Query is required', 400);
      }

      const result = await this.chatService.processQueryWithAI({
        query,
        conversationId,
        context,
      });

      return this.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return this.error(res, 'MISSING_DATA', 'Conversation ID is required', 400);
      }

      const history = this.chatService.getConversationHistory(conversationId);

      return this.success(res, { history }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear conversation
   */
  async clearConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return this.error(res, 'MISSING_DATA', 'Conversation ID is required', 400);
      }

      this.chatService.clearConversation(conversationId);

      return this.success(res, { message: 'Conversation cleared' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get query suggestions
   */
  async getQuerySuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.query;

      const suggestions = this.chatService.getQuerySuggestions(conversationId as string);

      return this.success(res, { suggestions }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for chat service
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction) {
    try {
      const isHealthy = await this.chatService.healthCheck();

      if (isHealthy) {
        return this.success(res, { status: 'healthy' }, 200);
      } else {
        return this.error(res, 'SERVICE_UNHEALTHY', 'Chat service is unhealthy', 503);
      }
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
