import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getAIIntegrationService } from '../services/ai-integration.service';

export class AIController extends BaseController {
  private aiService = getAIIntegrationService({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  });

  /**
   * Generate election summary
   */
  async generateElectionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionData } = req.body;

      if (!electionData) {
        return this.error(res, 'MISSING_DATA', 'Election data is required', 400);
      }

      const result = await this.aiService.generateElectionSummary(electionData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to generate summary', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionData } = req.body;

      if (!electionData) {
        return this.error(res, 'MISSING_DATA', 'Election data is required', 400);
      }

      const result = await this.aiService.generateExecutiveSummary(electionData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to generate executive summary', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze turnout trends
   */
  async analyzeTurnoutTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { historicalData, currentData, regionalData } = req.body;

      if (!historicalData || !currentData) {
        return this.error(res, 'MISSING_DATA', 'Historical and current data are required', 400);
      }

      const result = await this.aiService.analyzeTurnoutTrends(
        historicalData,
        currentData,
        regionalData
      );

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to analyze turnout trends', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze party performance
   */
  async analyzePartyPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { partyTrendData } = req.body;

      if (!partyTrendData) {
        return this.error(res, 'MISSING_DATA', 'Party trend data is required', 400);
      }

      const result = await this.aiService.analyzePartyPerformance(partyTrendData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to analyze party performance', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const { electionData } = req.body;

      if (!electionData) {
        return this.error(res, 'MISSING_DATA', 'Election data is required', 400);
      }

      const result = await this.aiService.detectAnomalies(electionData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to detect anomalies', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze fraud indicators
   */
  async analyzeFraudIndicators(req: Request, res: Response, next: NextFunction) {
    try {
      const { constituencyData } = req.body;

      if (!constituencyData) {
        return this.error(res, 'MISSING_DATA', 'Constituency data is required', 400);
      }

      const result = await this.aiService.analyzeFraudIndicators(constituencyData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to analyze fraud indicators', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze constituency
   */
  async analyzeConstituency(req: Request, res: Response, next: NextFunction) {
    try {
      const { constituencyData } = req.body;

      if (!constituencyData) {
        return this.error(res, 'MISSING_DATA', 'Constituency data is required', 400);
      }

      const result = await this.aiService.analyzeConstituency(constituencyData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to analyze constituency', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze swing constituency
   */
  async analyzeSwingConstituency(req: Request, res: Response, next: NextFunction) {
    try {
      const { constituencyData } = req.body;

      if (!constituencyData) {
        return this.error(res, 'MISSING_DATA', 'Constituency data is required', 400);
      }

      const result = await this.aiService.analyzeSwingConstituency(constituencyData);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to analyze swing constituency', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Explain to beginner
   */
  async explainToBeginner(req: Request, res: Response, next: NextFunction) {
    try {
      const { concept, data } = req.body;

      if (!concept) {
        return this.error(res, 'MISSING_DATA', 'Concept is required', 400);
      }

      const result = await this.aiService.explainToBeginner(concept, data);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to generate explanation', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Explain complex metric
   */
  async explainComplexMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const { metricName, metricValue, context } = req.body;

      if (!metricName || !metricValue) {
        return this.error(res, 'MISSING_DATA', 'Metric name and value are required', 400);
      }

      const result = await this.aiService.explainComplexMetric(metricName, metricValue, context);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to explain metric', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle natural language query
   */
  async handleNaturalLanguageQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { userQuery, availableData, analysisType } = req.body;

      if (!userQuery) {
        return this.error(res, 'MISSING_DATA', 'User query is required', 400);
      }

      const result = await this.aiService.handleNaturalLanguageQuery(
        userQuery,
        availableData,
        analysisType || 'general'
      );

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to process query', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform comparative analysis
   */
  async performComparativeAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { userQuery, dataSetA, dataSetB } = req.body;

      if (!userQuery || !dataSetA || !dataSetB) {
        return this.error(res, 'MISSING_DATA', 'Query and both data sets are required', 400);
      }

      const result = await this.aiService.performComparativeAnalysis(userQuery, dataSetA, dataSetB);

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to perform comparative analysis', 500);
      }

      return this.success(res, result.response, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Custom analysis endpoint
   */
  async customAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId, variables, context, useCache, responseType } = req.body;

      if (!templateId || !variables) {
        return this.error(res, 'MISSING_DATA', 'Template ID and variables are required', 400);
      }

      const result = await this.aiService.analyze({
        type: 'query',
        templateId,
        variables,
        context,
        useCache,
        responseType,
      });

      if (!result.success) {
        return this.error(res, 'AI_ERROR', result.error || 'Failed to perform custom analysis', 500);
      }

      return this.success(res, { response: result.response, metadata: result.metadata }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear AI cache
   */
  async clearCache(_req: Request, res: Response, next: NextFunction) {
    try {
      this.aiService.clearCache();

      return this.success(res, { message: 'Cache cleared successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = this.aiService.getCacheStats();

      return this.success(res, stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction) {
    try {
      const isHealthy = await this.aiService.healthCheck();

      if (isHealthy) {
        return this.success(res, { status: 'healthy' }, 200);
      } else {
        return this.error(res, 'SERVICE_UNHEALTHY', 'AI service is unhealthy', 503);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = this.aiService.getAvailableTemplates();

      return this.success(res, templates, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;

      if (!category) {
        return this.error(res, 'MISSING_DATA', 'Category is required', 400);
      }

      const templates = this.aiService.getTemplatesByCategory(category);

      return this.success(res, templates, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
