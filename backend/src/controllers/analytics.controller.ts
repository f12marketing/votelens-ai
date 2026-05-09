import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { analyticsService } from '../services/analytics.service';
import { GetAnalyticsDto, GetAdvancedAnalyticsDto } from '../dto/analytics.dto';

export class AnalyticsController extends BaseController {
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetAnalyticsDto;
      const metrics = await analyticsService.getMetrics(query);
      this.success(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async getAdvancedAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetAdvancedAnalyticsDto;
      const analytics = await analyticsService.getAdvancedAnalytics(query);
      this.success(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  async getConstituencyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analytics = await analyticsService.getConstituencyAnalytics(id);
      this.success(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  async getElectionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analytics = await analyticsService.getElectionAnalytics(id);
      this.success(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  async getTurnoutAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const analysis = await analyticsService.getTurnoutAnalysis(electionId);
      this.success(res, analysis);
    } catch (error) {
      next(error);
    }
  }

  async getVoteShareAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const analysis = await analyticsService.getVoteShareAnalysis(electionId);
      this.success(res, analysis);
    } catch (error) {
      next(error);
    }
  }

  async getSeatDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const distribution = await analyticsService.getSeatDistribution(electionId);
      this.success(res, distribution);
    } catch (error) {
      next(error);
    }
  }

  async getConstituencyRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const { criteria } = req.query;
      const ranking = await analyticsService.getConstituencyRanking(
        electionId,
        criteria as 'turnout' | 'margin' | 'competitive' || 'turnout'
      );
      this.success(res, ranking);
    } catch (error) {
      next(error);
    }
  }

  async getSwingAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const { previousElectionId } = req.query;
      const analysis = await analyticsService.getSwingAnalysis(
        electionId,
        previousElectionId as string
      );
      this.success(res, analysis);
    } catch (error) {
      next(error);
    }
  }

  async getHistoricalComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const { compareWithYears } = req.query;
      const comparison = await analyticsService.getHistoricalComparison(
        electionId,
        compareWithYears ? (compareWithYears as string).split(',').map(Number) : []
      );
      this.success(res, comparison);
    } catch (error) {
      next(error);
    }
  }

  async getCloseContests(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const { marginThreshold } = req.query;
      const detection = await analyticsService.getCloseContests(
        electionId,
        marginThreshold ? Number(marginThreshold) : 5
      );
      this.success(res, detection);
    } catch (error) {
      next(error);
    }
  }

  async getRegionalAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionId } = req.params;
      const analysis = await analyticsService.getRegionalAnalysis(electionId);
      this.success(res, analysis);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
