import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { insightService } from '../services/insight.service';
import { GetInsightsDto, GenerateInsightDto } from '../dto/insight.dto';

export class InsightController extends BaseController {
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetInsightsDto;
      const result = await insightService.getInsights(query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInsightById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const insight = await insightService.getInsightById(id);
      this.success(res, insight);
    } catch (error) {
      next(error);
    }
  }

  async generateInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: GenerateInsightDto = req.body;
      const insight = await insightService.generateInsight(dto);
      this.success(res, insight, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await insightService.deleteInsight(id);
      this.success(res, { message: 'Insight deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const insightController = new InsightController();
