import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getHistoricalComparisonService } from '../services/historical-comparison.service';
import { ComparisonRequest, ComparisonResponse } from '../types/comparison.schema';

export class ComparisonController extends BaseController {
  private comparisonService = getHistoricalComparisonService();

  /**
   * Compare two elections
   */
  async compareElections(req: Request, res: Response, next: NextFunction) {
    try {
      const request: ComparisonRequest = req.body;

      if (!request.electionId1 || !request.electionId2) {
        return this.error(res, 'MISSING_DATA', 'Election IDs are required', 400);
      }

      const comparison = await this.comparisonService.compareElections(request);

      // Apply filters if provided
      let filteredComparison = comparison;
      if (request.filters) {
        filteredComparison = this.comparisonService.applyFilters(comparison, request.filters);
      }

      const response: ComparisonResponse = {
        comparison: filteredComparison,
        charts: request.includeCharts ? this.comparisonService.generateCharts(filteredComparison) : undefined,
        metadata: {
          processingTime: 0,
          dataPoints: 0,
          filtersApplied: !!request.filters,
          comparisonYears: [comparison.year1, comparison.year2],
        },
      };

      return this.success(res, response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available elections for comparison
   */
  async getAvailableElections(_req: Request, res: Response, next: NextFunction) {
    try {
      // Mock data - in production, this would query the database
      const elections = [
        { id: 'election-2019', year: 2019, name: '2019 General Election' },
        { id: 'election-2024', year: 2024, name: '2024 General Election' },
      ];

      return this.success(res, { elections }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comparison filters
   */
  async getFilterOptions(_req: Request, res: Response, next: NextFunction) {
    try {
      // Mock data - in production, this would query the database
      const options = {
        states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'],
        parties: ['BJP', 'INC', 'DMK', 'TMC', 'BSP'],
        regions: ['North', 'South', 'East', 'West', 'Central'],
      };

      return this.success(res, options, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction) {
    try {
      return this.success(res, { status: 'healthy' }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const comparisonController = new ComparisonController();
