import { getGeminiService } from './gemini.service';
import { getInsightPromptsService } from './insight-prompts.service';
import { getInsightRankingService } from './insight-ranking.service';
import { getInsightPrioritizationService } from './insight-prioritization.service';
import { BaseService } from './base.service';
import {
  Insight,
  InsightGenerationRequest,
  InsightGenerationResponse,
  InsightType,
  InsightCategory,
} from '../types/insight.schema';

export class InsightGenerationService extends BaseService {
  private geminiService = getGeminiService({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  });
  private promptsService = getInsightPromptsService();
  private rankingService = getInsightRankingService();
  private prioritizationService = getInsightPrioritizationService();

  /**
   * Generate insights from election data
   */
  async generateInsights(request: InsightGenerationRequest): Promise<InsightGenerationResponse> {
    const startTime = Date.now();

    try {
      const insights: Insight[] = [];

      // Determine which insight types to generate
      const typesToGenerate = request.insightTypes || ['summary', 'anomaly', 'trend', 'movement'];
      const categoriesToGenerate = request.categories || ['turnout', 'party_performance', 'regional'];

      // Generate insights for each type and category combination
      for (const type of typesToGenerate) {
        for (const category of categoriesToGenerate) {
          const insight = await this.generateSingleInsight(request, type, category);
          if (insight) {
            insights.push(insight);
          }
        }
      }

      // Rank insights
      const rankedResults = this.rankingService.rankInsights(insights);

      // Update priorities based on ranking
      rankedResults.forEach(result => {
        const index = insights.findIndex(i => i.id === result.insight.id);
        if (index !== -1) {
          insights[index].priority = this.rankingService.determinePriority(result.score);
        }
      });

      // Prioritize insights
      const prioritizationResult = this.prioritizationService.prioritize(insights, {
        maxCritical: 3,
        maxHigh: 8,
        maxMedium: 12,
        minConfidence: request.minConfidence || 0.6,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        insights: prioritizationResult.selected,
        summary: this.generateSummary(prioritizationResult.selected),
        totalGenerated: insights.length,
        processingTime,
        metadata: {
          model: this.geminiService['config'].model,
          promptTemplates: typesToGenerate,
          avgConfidence: this.calculateAverage(prioritizationResult.selected, 'confidence'),
          avgImpact: this.calculateAverage(prioritizationResult.selected, 'impact'),
        },
      };
    } catch (error: any) {
      this.logError('Failed to generate insights', error);

      return {
        success: false,
        insights: [],
        summary: 'Failed to generate insights',
        totalGenerated: 0,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.geminiService['config'].model,
          promptTemplates: [],
          avgConfidence: 0,
          avgImpact: 0,
        },
      };
    }
  }

  /**
   * Generate a single insight
   */
  private async generateSingleInsight(
    request: InsightGenerationRequest,
    type: InsightType,
    category: InsightCategory
  ): Promise<Insight | null> {
    try {
      // Find appropriate template
      const templates = this.promptsService.getTemplatesByType(type);
      const categoryTemplate = templates.find(t => t.category === category);

      if (!categoryTemplate) {
        return null;
      }

      // Build prompt variables
      const variables = this.buildPromptVariables(request, type, category);

      // Build prompt
      const prompt = this.promptsService.buildPrompt(categoryTemplate.id, variables);

      // Generate response from Gemini
      const response = await this.geminiService.generateJSON<{
        title: string;
        summary: string;
        details: string;
        confidence: number;
        impact: number;
        relevance: number;
        dataPoints: Array<{ label: string; value: number | string; context?: string }>;
        recommendations?: string[];
      }>({ prompt }, categoryTemplate.outputSchema);

      // Create insight object
      const insight: Insight = {
        id: this.generateInsightId(),
        type,
        category,
        priority: 'medium', // Will be updated by ranking
        title: response.title,
        summary: response.summary,
        details: response.details,
        confidence: response.confidence,
        impact: response.impact,
        relevance: response.relevance,
        dataPoints: response.dataPoints,
        recommendations: response.recommendations,
        metadata: {
          electionId: request.electionId,
          constituencyId: request.constituencyId,
          state: request.state,
          metric: category,
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          generatedBy: 'ai',
          model: this.geminiService['config'].model,
          promptTemplate: categoryTemplate.id,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return insight;
    } catch (error: any) {
      this.logWarn(`Failed to generate insight for type ${type}, category ${category}`, error);
      return null;
    }
  }

  /**
   * Build prompt variables from request
   */
  private buildPromptVariables(
    request: InsightGenerationRequest,
    type: InsightType,
    category: InsightCategory
  ): Record<string, any> {
    const variables: Record<string, any> = {};

    // Add metrics
    if (request.metrics) {
      variables.metrics = JSON.stringify(request.metrics, null, 2);
    }

    // Add turnout data
    if (request.turnoutData) {
      variables.turnoutData = JSON.stringify(request.turnoutData, null, 2);
    }

    // Add historical data
    if (request.historicalData) {
      variables.historicalData = JSON.stringify(request.historicalData, null, 2);
    }

    // Add regional analytics
    if (request.regionalAnalytics) {
      variables.regionalData = JSON.stringify(request.regionalAnalytics, null, 2);
    }

    // Add category-specific data
    switch (category) {
      case 'margin':
        variables.marginData = JSON.stringify(
          request.metrics.voteShareDistribution,
          null,
          2
        );
        break;
      case 'party_performance':
        variables.partyData = JSON.stringify(
          request.metrics.voteShareDistribution,
          null,
          2
        );
        break;
      case 'demographic':
        variables.demographicData = JSON.stringify(
          request.turnoutData.byDemographic || [],
          null,
          2
        );
        break;
    }

    // Add type-specific data
    switch (type) {
      case 'movement':
        variables.swingData = JSON.stringify(
          {
            swingConstituencies: request.metrics.swingConstituencies,
            voteShareChanges: request.metrics.voteShareDistribution,
          },
          null,
          2
        );
        variables.emergenceData = JSON.stringify(
          request.metrics.voteShareDistribution,
          null,
          2
        );
        break;
      case 'explanation':
        variables.metricName = category;
        variables.metricValue = request.metrics.overallTurnout;
        variables.context = JSON.stringify(request.metrics, null, 2);
        break;
    }

    return variables;
  }

  /**
   * Generate a summary of insights
   */
  private generateSummary(insights: Insight[]): string {
    if (insights.length === 0) {
      return 'No insights generated.';
    }

    const byType = this.groupByType(insights);
    const byPriority = this.groupByPriority(insights);

    const parts = [
      `Generated ${insights.length} insights across ${Object.keys(byType).length} types.`,
    ];

    if (byPriority.critical.length > 0) {
      parts.push(`${byPriority.critical.length} critical insights require attention.`);
    }

    if (byPriority.high.length > 0) {
      parts.push(`${byPriority.high.length} high-priority insights identified.`);
    }

    const topInsights = this.rankingService.getTopInsights(insights, 3);
    if (topInsights.length > 0) {
      parts.push('Top insights:');
      topInsights.forEach(insight => {
        parts.push(`- ${insight.title}: ${insight.summary}`);
      });
    }

    return parts.join(' ');
  }

  /**
   * Group insights by type
   */
  private groupByType(insights: Insight[]): Record<InsightType, Insight[]> {
    const grouped: Record<InsightType, Insight[]> = {
      summary: [],
      anomaly: [],
      trend: [],
      movement: [],
      comparative: [],
      prediction: [],
      explanation: [],
    };

    insights.forEach(insight => {
      grouped[insight.type].push(insight);
    });

    return grouped;
  }

  /**
   * Group insights by priority
   */
  private groupByPriority(insights: Insight[]): Record<string, Insight[]> {
    const grouped: Record<string, Insight[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    insights.forEach(insight => {
      grouped[insight.priority].push(insight);
    });

    return grouped;
  }

  /**
   * Calculate average of a property
   */
  private calculateAverage(insights: Insight[], property: 'confidence' | 'impact'): number {
    if (insights.length === 0) return 0;
    const sum = insights.reduce((total, insight) => total + insight[property], 0);
    return sum / insights.length;
  }

  /**
   * Generate unique insight ID
   */
  private generateInsightId(): string {
    return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Regenerate a specific insight
   */
  async regenerateInsight(insightId: string, request: InsightGenerationRequest): Promise<Insight | null> {
    // Find the insight type and category from the ID (in a real system, you'd query the database)
    // For now, regenerate all insights and return the matching one
    const response = await this.generateInsights(request);
    return response.insights.find(i => i.id === insightId) || null;
  }

  /**
   * Get insights by priority
   */
  getInsightsByPriority(insights: Insight[], priority: string): Insight[] {
    return insights.filter(i => i.priority === priority);
  }

  /**
   * Get insights by type
   */
  getInsightsByType(insights: Insight[], type: InsightType): Insight[] {
    return insights.filter(i => i.type === type);
  }

  /**
   * Get insights by category
   */
  getInsightsByCategory(insights: Insight[], category: InsightCategory): Insight[] {
    return insights.filter(i => i.category === category);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.geminiService.healthCheck();
  }
}

// Singleton instance
let insightGenerationService: InsightGenerationService | null = null;

export function getInsightGenerationService(): InsightGenerationService {
  if (!insightGenerationService) {
    insightGenerationService = new InsightGenerationService();
  }
  return insightGenerationService;
}
