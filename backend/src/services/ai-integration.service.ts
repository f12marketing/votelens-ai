import { getGeminiService, GeminiConfig } from './gemini.service';
import { getPromptService, PromptContext } from './prompt-engineering.service';
import { getAIResponseFormatter, FormattedResponse } from './ai-response-formatter.service';
import { BaseService } from './base.service';

export interface AIAnalysisRequest {
  type: 'summary' | 'trend' | 'anomaly' | 'constituency' | 'explanation' | 'query';
  templateId: string;
  variables: Record<string, any>;
  context?: PromptContext;
  useCache?: boolean;
  outputFormat?: 'text' | 'json' | 'markdown';
  responseType?: 'summary' | 'insight' | 'analysis' | 'explanation' | 'recommendation';
}

export interface AIAnalysisResponse {
  success: boolean;
  response?: FormattedResponse;
  error?: string;
  metadata?: {
    cached: boolean;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    processingTime: number;
  };
}

export class AIIntegrationService extends BaseService {
  private geminiService: ReturnType<typeof getGeminiService>;
  private promptService: ReturnType<typeof getPromptService>;
  private formatter: ReturnType<typeof getAIResponseFormatter>;

  constructor(config: GeminiConfig) {
    super();
    this.geminiService = getGeminiService(config);
    this.promptService = getPromptService();
    this.formatter = getAIResponseFormatter();
  }

  /**
   * Main method to perform AI analysis
   */
  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();

    try {
      // Build prompt from template
      const prompt = this.promptService.buildPrompt(request.templateId, request.variables);

      // Add context if provided
      const finalPrompt = request.context 
        ? this.promptService.addContext(prompt, request.context)
        : prompt;

      // Optimize prompt for token usage
      const optimizedPrompt = this.geminiService.optimizePrompt(finalPrompt);

      // Get template configuration
      const templateConfig = this.promptService.getTemplateConfig(request.templateId);

      // Generate response from Gemini
      const geminiResponse = await this.geminiService.generateText(
        {
          prompt: optimizedPrompt,
          temperature: templateConfig?.temperature,
          maxOutputTokens: templateConfig?.maxTokens,
        },
        request.useCache ?? true
      );

      // Map request type to response type
      const responseTypeMap: Record<AIAnalysisRequest['type'], FormattedResponse['type']> = {
        summary: 'summary',
        trend: 'analysis',
        anomaly: 'analysis',
        constituency: 'insight',
        explanation: 'explanation',
        query: 'summary',
      };

      const responseType = request.responseType || responseTypeMap[request.type] || 'summary';

      // Format response
      const formattedResponse = this.formatter.formatResponse(
        geminiResponse.text,
        responseType,
        {
          model: this.geminiService['config'].model,
          tokens: geminiResponse.usage ? {
            prompt: geminiResponse.usage.promptTokens,
            completion: geminiResponse.usage.candidatesTokens,
            total: geminiResponse.usage.totalTokens,
          } : undefined,
        }
      );

      // Add visualization suggestions if data is available
      if (request.variables && Object.keys(request.variables).length > 0) {
        const visualizations = this.formatter.suggestVisualizations(
          geminiResponse.text,
          request.variables
        );
        formattedResponse.visualizations = visualizations;
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: formattedResponse,
        metadata: {
          cached: geminiResponse.cached,
          tokens: geminiResponse.usage ? {
            prompt: geminiResponse.usage.promptTokens,
            completion: geminiResponse.usage.candidatesTokens,
            total: geminiResponse.usage.totalTokens,
          } : undefined,
          processingTime,
        },
      };
    } catch (error: any) {
      this.logError('AI analysis failed', error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        metadata: {
          cached: false,
          processingTime,
        },
      };
    }
  }

  /**
   * Generate election summary
   */
  async generateElectionSummary(electionData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'summary',
      templateId: 'election-overview',
      variables: {
        electionName: electionData.name,
        electionDate: electionData.date,
        totalConstituencies: electionData.totalConstituencies,
        totalVoters: electionData.totalVoters,
        overallTurnout: electionData.overallTurnout,
        partyPerformance: JSON.stringify(electionData.partyPerformance, null, 2),
        keyStatistics: JSON.stringify(electionData.keyStatistics, null, 2),
      },
      context: {
        electionData,
      },
    });
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(electionData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'summary',
      templateId: 'executive-summary',
      variables: {
        electionData: JSON.stringify(electionData, null, 2),
      },
      context: {
        electionData,
      },
    });
  }

  /**
   * Analyze turnout trends
   */
  async analyzeTurnoutTrends(historicalData: any, currentData: any, regionalData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'trend',
      templateId: 'turnout-trend-analysis',
      variables: {
        historicalData: JSON.stringify(historicalData, null, 2),
        currentData: JSON.stringify(currentData, null, 2),
        regionalData: JSON.stringify(regionalData, null, 2),
      },
      context: {
        historicalData,
        electionData: currentData,
      },
    });
  }

  /**
   * Analyze party performance trends
   */
  async analyzePartyPerformance(partyTrendData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'trend',
      templateId: 'party-performance-trend',
      variables: {
        partyTrendData: JSON.stringify(partyTrendData, null, 2),
      },
      context: {
        electionData: partyTrendData,
      },
    });
  }

  /**
   * Detect anomalies in election data
   */
  async detectAnomalies(electionData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'anomaly',
      templateId: 'anomaly-detection',
      variables: {
        electionData: JSON.stringify(electionData, null, 2),
      },
      context: {
        electionData,
      },
      outputFormat: 'json',
    });
  }

  /**
   * Analyze fraud indicators
   */
  async analyzeFraudIndicators(constituencyData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'anomaly',
      templateId: 'fraud-indicators',
      variables: {
        constituencyData: JSON.stringify(constituencyData, null, 2),
      },
      context: {
        constituencyData,
      },
      outputFormat: 'json',
    });
  }

  /**
   * Analyze specific constituency
   */
  async analyzeConstituency(constituencyData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'constituency',
      templateId: 'constituency-analysis',
      variables: {
        constituencyName: constituencyData.name,
        state: constituencyData.state,
        electionResults: JSON.stringify(constituencyData.electionResults, null, 2),
        demographics: JSON.stringify(constituencyData.demographics, null, 2),
        historicalData: JSON.stringify(constituencyData.historicalData, null, 2),
      },
      context: {
        constituencyData,
      },
    });
  }

  /**
   * Analyze swing constituency
   */
  async analyzeSwingConstituency(constituencyData: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'constituency',
      templateId: 'swing-constituency-analysis',
      variables: {
        constituencyData: JSON.stringify(constituencyData, null, 2),
      },
      context: {
        constituencyData,
      },
    });
  }

  /**
   * Explain concept to beginner
   */
  async explainToBeginner(concept: string, data: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'explanation',
      templateId: 'explain-to-beginner',
      variables: {
        concept,
        data: JSON.stringify(data, null, 2),
      },
    });
  }

  /**
   * Explain complex metric
   */
  async explainComplexMetric(metricName: string, metricValue: any, context: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'explanation',
      templateId: 'explain-complex-metric',
      variables: {
        metricName,
        metricValue: JSON.stringify(metricValue, null, 2),
        context: JSON.stringify(context, null, 2),
      },
    });
  }

  /**
   * Handle natural language query
   */
  async handleNaturalLanguageQuery(userQuery: string, availableData: any, analysisType: string): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'query',
      templateId: 'natural-language-query',
      variables: {
        userQuery,
        availableData: JSON.stringify(availableData, null, 2),
        analysisType,
      },
      context: {
        userQuery,
        electionData: availableData,
        analysisType,
      },
    });
  }

  /**
   * Perform comparative analysis
   */
  async performComparativeAnalysis(userQuery: string, dataSetA: any, dataSetB: any): Promise<AIAnalysisResponse> {
    return this.analyze({
      type: 'query',
      templateId: 'comparative-analysis',
      variables: {
        userQuery,
        dataSetA: JSON.stringify(dataSetA, null, 2),
        dataSetB: JSON.stringify(dataSetB, null, 2),
      },
      outputFormat: 'markdown',
    });
  }

  /**
   * Stream analysis response
   */
  async *streamAnalysis(request: AIAnalysisRequest): AsyncGenerator<string, void, unknown> {
    try {
      // Build prompt from template
      const prompt = this.promptService.buildPrompt(request.templateId, request.variables);

      // Add context if provided
      const finalPrompt = request.context 
        ? this.promptService.addContext(prompt, request.context)
        : prompt;

      // Optimize prompt
      const optimizedPrompt = this.geminiService.optimizePrompt(finalPrompt);

      // Stream response
      const stream = this.geminiService.generateTextStream({
        prompt: optimizedPrompt,
        temperature: this.promptService.getTemplateConfig(request.templateId)?.temperature,
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error: any) {
      this.logError('AI stream analysis failed', error);
      throw error;
    }
  }

  /**
   * Clear AI cache
   */
  clearCache(): void {
    this.geminiService.clearCache();
    this.logInfo('AI cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.geminiService.getCacheStats();
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    return this.geminiService.healthCheck();
  }

  /**
   * Get available prompt templates
   */
  getAvailableTemplates() {
    return this.promptService.listTemplates();
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string) {
    return this.promptService.getTemplatesByCategory(category as any);
  }
}

// Singleton instance
let aiService: AIIntegrationService | null = null;

export function getAIIntegrationService(config?: GeminiConfig): AIIntegrationService {
  if (!aiService && config) {
    aiService = new AIIntegrationService(config);
  }

  if (!aiService) {
    throw new Error('AI integration service not initialized. Provide configuration.');
  }

  return aiService;
}
