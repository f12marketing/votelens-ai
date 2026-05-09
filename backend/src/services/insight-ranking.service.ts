import { Insight, InsightType, InsightCategory, InsightPriority } from '../types/insight.schema';

export interface RankingCriteria {
  confidence: number; // Weight: 0-1
  impact: number; // Weight: 0-1
  relevance: number; // Weight: 0-1
  recency: number; // Weight: 0-1
  uniqueness: number; // Weight: 0-1
}

export interface RankingResult {
  insight: Insight;
  score: number;
  breakdown: {
    confidence: number;
    impact: number;
    relevance: number;
    recency: number;
    uniqueness: number;
  };
}

export class InsightRankingService {
  private defaultCriteria: RankingCriteria = {
    confidence: 0.25,
    impact: 0.30,
    relevance: 0.20,
    recency: 0.15,
    uniqueness: 0.10,
  };

  /**
   * Rank insights based on configurable criteria
   */
  rankInsights(insights: Insight[], criteria?: Partial<RankingCriteria>): RankingResult[] {
    const finalCriteria = { ...this.defaultCriteria, ...criteria };

    return insights.map(insight => {
      const breakdown = this.calculateBreakdown(insight, finalCriteria);
      const score = this.calculateTotalScore(breakdown, finalCriteria);

      return {
        insight,
        score,
        breakdown,
      };
    }).sort((a, b) => b.score - a.score); // Sort by highest score first
  }

  /**
   * Calculate breakdown of scores for each criterion
   */
  private calculateBreakdown(insight: Insight, criteria: RankingCriteria) {
    const confidenceScore = insight.confidence;
    const impactScore = insight.impact / 10; // Normalize to 0-1
    const relevanceScore = insight.relevance / 10; // Normalize to 0-1
    const recencyScore = this.calculateRecencyScore(insight.createdAt);
    const uniquenessScore = this.calculateUniquenessScore(insight);

    return {
      confidence: confidenceScore,
      impact: impactScore,
      relevance: relevanceScore,
      recency: recencyScore,
      uniqueness: uniquenessScore,
    };
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(breakdown: any, criteria: RankingCriteria): number {
    return (
      breakdown.confidence * criteria.confidence +
      breakdown.impact * criteria.impact +
      breakdown.relevance * criteria.relevance +
      breakdown.recency * criteria.recency +
      breakdown.uniqueness * criteria.uniqueness
    );
  }

  /**
   * Calculate recency score (more recent = higher score)
   */
  private calculateRecencyScore(createdAt: Date): number {
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: score = e^(-days/30)
    // Insights from 30 days ago have score ~0.37
    // Insights from 7 days ago have score ~0.79
    // Insights from today have score ~1.0
    return Math.exp(-daysSinceCreation / 30);
  }

  /**
   * Calculate uniqueness score based on data points and content
   */
  private calculateUniquenessScore(insight: Insight): number {
    // Base score from data point variety
    const dataPointVariety = Math.min(insight.dataPoints.length / 5, 1);
    
    // Adjust for insight type (some types are inherently more unique)
    const typeMultiplier = this.getTypeUniquenessMultiplier(insight.type);
    
    // Adjust for category variety
    const categoryMultiplier = this.getCategoryUniquenessMultiplier(insight.category);

    return dataPointVariety * typeMultiplier * categoryMultiplier;
  }

  private getTypeUniquenessMultiplier(type: InsightType): number {
    const multipliers: Record<InsightType, number> = {
      anomaly: 1.2, // Anomalies are more unique
      movement: 1.1, // Political movements are interesting
      trend: 1.0,
      comparative: 1.0,
      prediction: 0.9, // Predictions are common
      explanation: 0.8, // Explanations are common
      summary: 0.7, // Summaries are least unique
    };
    return multipliers[type] || 1.0;
  }

  private getCategoryUniquenessMultiplier(category: InsightCategory): number {
    const multipliers: Record<InsightCategory, number> = {
      demographic: 1.2,
      regional: 1.1,
      party_performance: 1.0,
      margin: 1.0,
      turnout: 0.9,
      constituency: 0.9,
      vote_share: 0.8,
      strategic: 0.7,
    };
    return multipliers[category] || 1.0;
  }

  /**
   * Determine priority based on score
   */
  determinePriority(score: number): InsightPriority {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Filter insights by minimum score
   */
  filterByMinScore(insights: Insight[], minScore: number): Insight[] {
    const rankingResults = this.rankInsights(insights);
    return rankingResults
      .filter(result => result.score >= minScore)
      .map(result => {
        // Update priority based on score
        result.insight.priority = this.determinePriority(result.score);
        return result.insight;
      });
  }

  /**
   * Get top N insights
   */
  getTopInsights(insights: Insight[], count: number): Insight[] {
    const rankingResults = this.rankInsights(insights);
    return rankingResults
      .slice(0, count)
      .map(result => {
        result.insight.priority = this.determinePriority(result.score);
        return result.insight;
      });
  }

  /**
   * Group insights by priority
   */
  groupByPriority(insights: Insight[]): Record<InsightPriority, Insight[]> {
    const rankingResults = this.rankInsights(insights);
    
    const grouped: Record<InsightPriority, Insight[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    rankingResults.forEach(result => {
      const priority = this.determinePriority(result.score);
      result.insight.priority = priority;
      grouped[priority].push(result.insight);
    });

    return grouped;
  }

  /**
   * Calculate diversity score for a set of insights
   */
  calculateDiversityScore(insights: Insight[]): number {
    if (insights.length === 0) return 0;

    // Type diversity
    const types = new Set(insights.map(i => i.type));
    const typeDiversity = types.size / 7; // 7 possible types

    // Category diversity
    const categories = new Set(insights.map(i => i.category));
    const categoryDiversity = categories.size / 8; // 8 possible categories

    // Priority diversity
    const priorities = new Set(insights.map(i => i.priority));
    const priorityDiversity = priorities.size / 4; // 4 possible priorities

    return (typeDiversity + categoryDiversity + priorityDiversity) / 3;
  }

  /**
   * Select diverse insights (avoid similar insights)
   */
  selectDiverseInsights(insights: Insight[], count: number): Insight[] {
    if (insights.length <= count) return insights;

    const selected: Insight[] = [];
    const remaining = [...insights];
    const rankingResults = this.rankInsights(insights);

    // Greedy selection: pick highest score, then pick insights that add diversity
    while (selected.length < count && remaining.length > 0) {
      if (selected.length === 0) {
        // Pick highest score first
        const best = rankingResults[0].insight;
        selected.push(best);
        remaining.splice(remaining.indexOf(best), 1);
      } else {
        // Pick insight that maximizes diversity
        let bestCandidate: Insight | null = null;
        let bestDiversityScore = 0;

        for (const candidate of remaining) {
          const testSelection = [...selected, candidate];
          const diversityScore = this.calculateDiversityScore(testSelection);
          
          if (diversityScore > bestDiversityScore) {
            bestDiversityScore = diversityScore;
            bestCandidate = candidate;
          }
        }

        if (bestCandidate) {
          selected.push(bestCandidate);
          remaining.splice(remaining.indexOf(bestCandidate), 1);
        }
      }
    }

    return selected;
  }

  /**
   * Get ranking explanation for an insight
   */
  getRankingExplanation(insight: Insight, criteria?: Partial<RankingCriteria>): string {
    const finalCriteria = { ...this.defaultCriteria, ...criteria };
    const breakdown = this.calculateBreakdown(insight, finalCriteria);
    const score = this.calculateTotalScore(breakdown, finalCriteria);
    const priority = this.determinePriority(score);

    const parts = [
      `Overall Score: ${score.toFixed(2)} (${priority} priority)`,
      `Confidence: ${(breakdown.confidence * 100).toFixed(0)}% (weight: ${(finalCriteria.confidence * 100).toFixed(0)}%)`,
      `Impact: ${(breakdown.impact * 10).toFixed(1)}/10 (weight: ${(finalCriteria.impact * 100).toFixed(0)}%)`,
      `Relevance: ${(breakdown.relevance * 10).toFixed(1)}/10 (weight: ${(finalCriteria.relevance * 100).toFixed(0)}%)`,
      `Recency: ${(breakdown.recency * 100).toFixed(0)}% (weight: ${(finalCriteria.recency * 100).toFixed(0)}%)`,
      `Uniqueness: ${(breakdown.uniqueness * 100).toFixed(0)}% (weight: ${(finalCriteria.uniqueness * 100).toFixed(0)}%)`,
    ];

    return parts.join('\n');
  }
}

// Singleton instance
let rankingService: InsightRankingService | null = null;

export function getInsightRankingService(): InsightRankingService {
  if (!rankingService) {
    rankingService = new InsightRankingService();
  }
  return rankingService;
}
