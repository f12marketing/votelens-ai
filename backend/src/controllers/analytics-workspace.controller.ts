import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getAnalyticsFilterService } from '../services/analytics-filter.service';
import { getTrendModelingService } from '../services/trend-modeling.service';
import { getConstituencyAnalyticsService } from '../services/constituency-analytics.service';
import { getAnalyticsExportService } from '../services/analytics-export.service';
import { AnalyticsWorkspaceRequest, AnalyticsWorkspaceResponse, ExportOptions } from '../types/analytics-workspace.schema';

// Simple UUID generator
const generateUUID = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export class AnalyticsWorkspaceController extends BaseController {
  private filterService = getAnalyticsFilterService();
  private trendService = getTrendModelingService();
  private constituencyService = getConstituencyAnalyticsService();
  private exportService = getAnalyticsExportService();

  /**
   * Create analytics workspace
   */
  async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const request: AnalyticsWorkspaceRequest = req.body;

      if (!request.name || !request.filters) {
        return this.error(res, 'MISSING_DATA', 'Name and filters are required', 400);
      }

      // Validate filters
      const filterValidation = this.filterService.validateFilter(request.filters);
      if (!filterValidation.valid) {
        return this.error(res, 'INVALID_FILTER', filterValidation.errors.join(', '), 400);
      }

      // Apply filters
      const filteredData = this.filterService.applyFilters(request.filters);

      // Generate trend models
      const trendModels = this.generateTrendModels(filteredData);

      // Generate constituency analytics
      const constituencyAnalytics = await this.constituencyService.generateBatchAnalytics(
        filteredData.constituencies.map((c: any) => ({
          id: c.id,
          name: c.name,
          state: c.state,
        }))
      );

      // Generate insights
      const insights = this.generateInsights(filteredData, constituencyAnalytics, trendModels);

      // Create workspace
      const workspace = {
        id: generateUUID(),
        name: request.name,
        description: request.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        filters: request.filters,
        views: request.views || [],
        insights,
        trendModels,
        constituencyAnalytics,
        summary: this.generateSummary(filteredData, insights),
        isShared: false,
      };

      const response: AnalyticsWorkspaceResponse = {
        workspace,
        metadata: {
          processingTime: 0,
          dataSources: ['constituencies', 'elections', 'parties'],
          refreshDate: new Date(),
        },
      };

      return this.success(res, response, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // In production, this would query the database
      const workspace = this.getMockWorkspace(id);

      if (!workspace) {
        return this.error(res, 'NOT_FOUND', 'Workspace not found', 404);
      }

      return this.success(res, { workspace }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update workspace
   */
  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // In production, this would update the database
      const workspace = this.getMockWorkspace(id);

      if (!workspace) {
        return this.error(res, 'NOT_FOUND', 'Workspace not found', 404);
      }

      const updatedWorkspace = {
        ...workspace,
        ...updates,
        updatedAt: new Date(),
      };

      return this.success(res, { workspace: updatedWorkspace }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // In production, this would delete from the database
      const workspace = this.getMockWorkspace(id);

      if (!workspace) {
        return this.error(res, 'NOT_FOUND', 'Workspace not found', 404);
      }

      return this.success(res, { message: 'Workspace deleted' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List workspaces
   */
  async listWorkspaces(_req: Request, res: Response, next: NextFunction) {
    try {
      // In production, this would query the database
      const workspaces = [
        this.getMockWorkspace('workspace-1'),
        this.getMockWorkspace('workspace-2'),
      ].filter(Boolean);

      return this.success(res, { workspaces }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export workspace
   */
  async exportWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const options: ExportOptions = req.body;

      if (!options.format) {
        return this.error(res, 'MISSING_DATA', 'Export format is required', 400);
      }

      const workspace = this.getMockWorkspace(id);

      if (!workspace) {
        return this.error(res, 'NOT_FOUND', 'Workspace not found', 404);
      }

      const validation = this.exportService.validateExportOptions(options);
      if (!validation.valid) {
        return this.error(res, 'INVALID_OPTIONS', validation.errors.join(', '), 400);
      }

      const result = await this.exportService.exportWorkspace(workspace, options);

      return this.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available export formats
   */
  async getExportFormats(_req: Request, res: Response, next: NextFunction) {
    try {
      const formats = this.exportService.getAvailableFormats();

      return this.success(res, { formats }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get filter suggestions
   */
  async getFilterSuggestions(_req: Request, res: Response, next: NextFunction) {
    try {
      const suggestions = this.filterService.getFilterSuggestions();

      return this.success(res, suggestions, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate trend models
   */
  private generateTrendModels(filteredData: any): any[] {
    const models: any[] = [];

    // Generate turnout trend model
    const turnoutData = filteredData.constituencies.map((c: any) => ({
      year: c.year,
      value: c.turnout,
    }));

    if (turnoutData.length >= 2) {
      try {
        const turnoutModel = this.trendService.createLinearModel(turnoutData);
        models.push(turnoutModel);
      } catch (error) {
        console.error('Failed to create turnout trend model', error);
      }
    }

    return models;
  }

  /**
   * Generate insights
   */
  private generateInsights(_filteredData: any, constituencyAnalytics: any[], trendModels: any[]): any[] {
    const insights: any[] = [];

    // High flip risk insight
    const highFlipRisk = constituencyAnalytics.filter((a: any) => a.predictiveIndicators.flipRisk > 0.7);
    if (highFlipRisk.length > 0) {
      insights.push({
        id: generateUUID(),
        type: 'risk',
        title: 'High Flip Risk Constituencies',
        description: `${highFlipRisk.length} constituencies at high risk of flipping in next election`,
        confidence: 0.8,
        impact: 'high',
        urgency: 'immediate',
        affectedEntities: {
          constituencies: highFlipRisk.map((a: any) => a.constituencyId),
        },
        metrics: [
          { metric: 'Flip Risk', value: 0.7 },
        ],
        recommendations: ['Monitor these constituencies closely', 'Increase campaign resources'],
        supportingData: {
          chartType: 'bar',
          data: highFlipRisk.map((a: any) => ({ name: a.constituencyName, risk: a.predictiveIndicators.flipRisk })),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['flip-risk', 'high-priority'],
      });
    }

    // Turnout trend insight
    if (trendModels.length > 0) {
      const turnoutTrend = trendModels[0];
      if (turnoutTrend.parameters.slope) {
        insights.push({
          id: generateUUID(),
          type: 'trend',
          title: 'Turnout Trend Analysis',
          description: `Turnout is ${turnoutTrend.parameters.slope > 0 ? 'increasing' : 'decreasing'} at ${Math.abs(turnoutTrend.parameters.slope).toFixed(2)}% per year`,
          confidence: turnoutTrend.parameters.r_squared,
          impact: 'medium',
          urgency: 'monitor',
          affectedEntities: {},
          metrics: [
            { metric: 'Trend Rate', value: turnoutTrend.parameters.slope },
            { metric: 'R-squared', value: turnoutTrend.parameters.r_squared },
          ],
          recommendations: turnoutTrend.parameters.slope > 0 
            ? ['Leverage high turnout areas'] 
            : ['Investigate turnout decline causes'],
          supportingData: {
            chartType: 'line',
            data: turnoutTrend.predictions,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['turnout', 'trend'],
        });
      }
    }

    return insights;
  }

  /**
   * Generate workspace summary
   */
  private generateSummary(filteredData: any, insights: any[]): any {
    return {
      totalInsights: insights.length,
      highPriorityInsights: insights.filter((i: any) => i.urgency === 'immediate').length,
      totalTrendModels: 0,
      totalConstituencies: filteredData.constituencies.length,
      dataPoints: filteredData.summary.estimatedDataPoints,
      lastUpdated: new Date(),
      keyMetrics: [
        { label: 'Total Constituencies', value: filteredData.constituencies.length },
        { label: 'Total Insights', value: insights.length },
        { label: 'High Priority', value: insights.filter((i: any) => i.urgency === 'immediate').length },
      ],
      topInsights: insights.slice(0, 3).map((i: any) => i.title),
    };
  }

  /**
   * Get mock workspace (for development)
   */
  private getMockWorkspace(id: string): any {
    if (id === 'workspace-1') {
      return {
        id: 'workspace-1',
        name: 'National Election Analysis',
        description: 'Comprehensive analysis of national election data',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        filters: {},
        views: [],
        insights: [],
        trendModels: [],
        constituencyAnalytics: [],
        summary: {
          totalInsights: 5,
          highPriorityInsights: 2,
          totalTrendModels: 3,
          totalConstituencies: 100,
          dataPoints: 1000,
          lastUpdated: new Date(),
          keyMetrics: [],
          topInsights: [],
        },
        isShared: false,
      };
    }
    return null;
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

export const analyticsWorkspaceController = new AnalyticsWorkspaceController();
