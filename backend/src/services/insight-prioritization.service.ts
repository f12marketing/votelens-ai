import { Insight, InsightType, InsightCategory, InsightPriority, InsightFilter } from '../types/insight.schema';
import { getInsightRankingService } from './insight-ranking.service';

export interface PrioritizationConfig {
  maxCritical: number;
  maxHigh: number;
  maxMedium: number;
  minConfidence: number;
  minImpact: number;
  diversityThreshold: number;
  categoryBalance: boolean;
  typeBalance: boolean;
  excludeTypes?: InsightType[];
  excludeCategories?: InsightCategory[];
}

export interface PrioritizationResult {
  selected: Insight[];
  excluded: Insight[];
  summary: {
    total: number;
    selected: number;
    excluded: number;
    byPriority: Record<InsightPriority, number>;
    byCategory: Record<InsightCategory, number>;
    byType: Record<InsightType, number>;
    diversityScore: number;
  };
}

export class InsightPrioritizationService {
  private rankingService = getInsightRankingService();

  private defaultConfig: PrioritizationConfig = {
    maxCritical: 5,
    maxHigh: 10,
    maxMedium: 15,
    minConfidence: 0.6,
    minImpact: 4,
    diversityThreshold: 0.7,
    categoryBalance: true,
    typeBalance: true,
  };

  /**
   * Prioritize insights based on configuration
   */
  prioritize(insights: Insight[], config?: Partial<PrioritizationConfig>): PrioritizationResult {
    const finalConfig = { ...this.defaultConfig, ...config };

    // Apply filters
    let filtered = this.applyFilters(insights, finalConfig);

    // Remove excluded types and categories
    if (finalConfig.excludeTypes && finalConfig.excludeTypes.length > 0) {
      filtered = filtered.filter(i => !finalConfig.excludeTypes!.includes(i.type));
    }
    if (finalConfig.excludeCategories && finalConfig.excludeCategories.length > 0) {
      filtered = filtered.filter(i => !finalConfig.excludeCategories!.includes(i.category));
    }

    // Filter by minimum confidence and impact
    filtered = filtered.filter(
      i => i.confidence >= finalConfig.minConfidence && i.impact >= finalConfig.minImpact
    );

    // Rank insights
    const ranked = this.rankingService.rankInsights(filtered);

    // Group by priority
    const grouped = this.groupByPriority(ranked);

    // Select insights based on priority limits
    const selected = this.selectByPriorityLimits(grouped, finalConfig);

    // Apply balancing if enabled
    if (finalConfig.categoryBalance || finalConfig.typeBalance) {
      this.applyBalancing(selected, grouped, finalConfig);
    }

    // Ensure diversity
    if (finalConfig.diversityThreshold > 0) {
      this.ensureDiversity(selected, finalConfig);
    }

    const excluded = filtered.filter(i => !selected.includes(i));

    return {
      selected,
      excluded,
      summary: this.calculateSummary(selected, excluded, filtered),
    };
  }

  /**
   * Apply filters to insights
   */
  private applyFilters(insights: Insight[], config: PrioritizationConfig): Insight[] {
    return insights.filter(insight => {
      // Filter by minimum confidence
      if (insight.confidence < config.minConfidence) return false;
      
      // Filter by minimum impact
      if (insight.impact < config.minImpact) return false;

      return true;
    });
  }

  /**
   * Group ranked insights by priority
   */
  private groupByPriority(ranked: any[]): Record<InsightPriority, any[]> {
    const grouped: Record<InsightPriority, any[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    ranked.forEach(result => {
      const priority = this.rankingService.determinePriority(result.score);
      grouped[priority].push(result);
    });

    return grouped;
  }

  /**
   * Select insights based on priority limits
   */
  private selectByPriorityLimits(
    grouped: Record<InsightPriority, any[]>,
    config: PrioritizationConfig
  ): Insight[] {
    const selected: Insight[] = [];

    // Select critical insights (up to maxCritical)
    const criticalInsights = grouped.critical
      .slice(0, config.maxCritical)
      .map((r: any) => r.insight);
    selected.push(...criticalInsights);

    // Select high priority insights (up to maxHigh)
    const highInsights = grouped.high
      .slice(0, config.maxHigh)
      .map((r: any) => r.insight);
    selected.push(...highInsights);

    // Select medium priority insights (up to maxMedium)
    const mediumInsights = grouped.medium
      .slice(0, config.maxMedium)
      .map((r: any) => r.insight);
    selected.push(...mediumInsights);

    return selected;
  }

  /**
   * Apply category and type balancing
   */
  private applyBalancing(
    selected: Insight[],
    grouped: Record<InsightPriority, any[]>,
    config: PrioritizationConfig
  ): void {
    if (!config.categoryBalance && !config.typeBalance) return;

    // Calculate current distribution
    const categoryDistribution = this.calculateDistribution(selected, 'category');
    const typeDistribution = this.calculateDistribution(selected, 'type');

    // Identify underrepresented categories
    if (config.categoryBalance) {
      const underrepresentedCategories = this.findUnderrepresented(
        categoryDistribution,
        'category'
      );
      this.addUnderrepresentedInsights(
        selected,
        grouped,
        underrepresentedCategories,
        'category',
        config
      );
    }

    // Identify underrepresented types
    if (config.typeBalance) {
      const underrepresentedTypes = this.findUnderrepresented(typeDistribution, 'type');
      this.addUnderrepresentedInsights(
        selected,
        grouped,
        underrepresentedTypes,
        'type',
        config
      );
    }
  }

  /**
   * Calculate distribution of insights by field
   */
  private calculateDistribution(
    insights: Insight[],
    field: 'category' | 'type'
  ): Record<string, number> {
    const distribution: Record<string, number> = {};
    insights.forEach(insight => {
      const key = insight[field];
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Find underrepresented categories/types
   */
  private findUnderrepresented(
    distribution: Record<string, number>,
    field: 'category' | 'type'
  ): string[] {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const average = total / Object.keys(distribution).length;
    const threshold = average * 0.5;

    return Object.entries(distribution)
      .filter(([_, count]) => count < threshold)
      .map(([key, _]) => key);
  }

  /**
   * Add insights for underrepresented categories/types
   */
  private addUnderrepresentedInsights(
    selected: Insight[],
    grouped: Record<InsightPriority, any[]>,
    underrepresented: string[],
    field: 'category' | 'type',
    config: PrioritizationConfig
  ): void {
    for (const key of underrepresented) {
      // Find insights with this category/type that aren't already selected
      const available = Object.values(grouped)
        .flat()
        .filter((r: any) => !selected.includes(r.insight))
        .filter((r: any) => r.insight[field] === key)
        .sort((a: any, b: any) => b.score - a.score);

      // Add the best insight if available
      if (available.length > 0) {
        const best = available[0].insight;
        selected.push(best);
      }
    }
  }

  /**
   * Ensure diversity in selected insights
   */
  private ensureDiversity(selected: Insight[], config: PrioritizationConfig): void {
    const diversityScore = this.rankingService.calculateDiversityScore(selected);

    if (diversityScore >= config.diversityThreshold) {
      return; // Already diverse enough
    }

    // Replace some insights with more diverse ones
    const allRanked = this.rankingService.rankInsights(selected);
    const diverseSelection = this.rankingService.selectDiverseInsights(
      selected,
      selected.length
    );

    // Replace selected with diverse selection
    selected.splice(0, selected.length, ...diverseSelection);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    selected: Insight[],
    excluded: Insight[],
    filtered: Insight[]
  ): PrioritizationResult['summary'] {
    const byPriority: Record<InsightPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byCategory: Record<InsightCategory, number> = {};
    const byType: Record<InsightType, number> = {};

    selected.forEach(insight => {
      byPriority[insight.priority]++;
      byCategory[insight.category] = (byCategory[insight.category] || 0) + 1;
      byType[insight.type] = (byType[insight.type] || 0) + 1;
    });

    const diversityScore = this.rankingService.calculateDiversityScore(selected);

    return {
      total: filtered.length,
      selected: selected.length,
      excluded: excluded.length,
      byPriority,
      byCategory,
      byType,
      diversityScore,
    };
  }

  /**
   * Get prioritization recommendations
   */
  getRecommendations(insights: Insight[]): {
    config: Partial<PrioritizationConfig>;
    reasoning: string[];
  } {
    const rankingResults = this.rankingService.rankInsights(insights);
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    const avgImpact = insights.reduce((sum, i) => sum + i.impact, 0) / insights.length;

    const config: Partial<PrioritizationConfig> = {};
    const reasoning: string[] = [];

    // Adjust confidence threshold based on average
    if (avgConfidence > 0.8) {
      config.minConfidence = 0.8;
      reasoning.push('High average confidence detected, raising threshold to 0.8');
    } else if (avgConfidence < 0.5) {
      config.minConfidence = 0.4;
      reasoning.push('Low average confidence detected, lowering threshold to 0.4');
    }

    // Adjust impact threshold based on average
    if (avgImpact > 7) {
      config.minImpact = 6;
      reasoning.push('High average impact detected, raising threshold to 6');
    } else if (avgImpact < 4) {
      config.minImpact = 3;
      reasoning.push('Low average impact detected, lowering threshold to 3');
    }

    // Adjust limits based on insight count
    const totalInsights = insights.length;
    if (totalInsights > 50) {
      config.maxCritical = 8;
      config.maxHigh = 15;
      config.maxMedium = 20;
      reasoning.push('Large insight set detected, increasing priority limits');
    } else if (totalInsights < 20) {
      config.maxCritical = 3;
      config.maxHigh = 6;
      config.maxMedium = 8;
      reasoning.push('Small insight set detected, decreasing priority limits');
    }

    return { config, reasoning };
  }

  /**
   * Validate prioritization configuration
   */
  validateConfig(config: Partial<PrioritizationConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.minConfidence !== undefined && (config.minConfidence < 0 || config.minConfidence > 1)) {
      errors.push('minConfidence must be between 0 and 1');
    }

    if (config.minImpact !== undefined && (config.minImpact < 0 || config.minImpact > 10)) {
      errors.push('minImpact must be between 0 and 10');
    }

    if (config.diversityThreshold !== undefined && (config.diversityThreshold < 0 || config.diversityThreshold > 1)) {
      errors.push('diversityThreshold must be between 0 and 1');
    }

    if (config.maxCritical !== undefined && config.maxCritical < 0) {
      errors.push('maxCritical must be non-negative');
    }

    if (config.maxHigh !== undefined && config.maxHigh < 0) {
      errors.push('maxHigh must be non-negative');
    }

    if (config.maxMedium !== undefined && config.maxMedium < 0) {
      errors.push('maxMedium must be non-negative');
    }

    return { valid: errors.length === 0, errors };
  }
}

// Singleton instance
let prioritizationService: InsightPrioritizationService | null = null;

export function getInsightPrioritizationService(): InsightPrioritizationService {
  if (!prioritizationService) {
    prioritizationService = new InsightPrioritizationService();
  }
  return prioritizationService;
}
