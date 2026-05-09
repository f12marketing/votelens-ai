import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getInsightGenerationService } from '../services/insight-generation.service';
import { InsightGenerationRequest } from '../types/insight.schema';

export class InsightGenerationController extends BaseController {
  private insightService = getInsightGenerationService();

  /**
   * Generate insights from election data
   */
  async generateInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const request: InsightGenerationRequest = req.body;

      if (!request.electionId) {
        return this.error(res, 'MISSING_DATA', 'Election ID is required', 400);
      }

      if (!request.metrics) {
        return this.error(res, 'MISSING_DATA', 'Election metrics are required', 400);
      }

      const result = await this.insightService.generateInsights(request);

      if (!result.success) {
        return this.error(res, 'GENERATION_FAILED', 'Failed to generate insights', 500);
      }

      return this.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate a specific insight
   */
  async regenerateInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const { insightId } = req.params;
      const request: InsightGenerationRequest = req.body;

      if (!insightId) {
        return this.error(res, 'MISSING_DATA', 'Insight ID is required', 400);
      }

      const insight = await this.insightService.regenerateInsight(insightId, request);

      if (!insight) {
        return this.error(res, 'NOT_FOUND', 'Insight not found', 404);
      }

      return this.success(res, insight, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for insight generation service
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction) {
    try {
      const isHealthy = await this.insightService.healthCheck();

      if (isHealthy) {
        return this.success(res, { status: 'healthy' }, 200);
      } else {
        return this.error(res, 'SERVICE_UNHEALTHY', 'Insight generation service is unhealthy', 503);
      }
    } catch (error) {
      next(error);
    }
  }
}

export const insightGenerationController = new InsightGenerationController();
