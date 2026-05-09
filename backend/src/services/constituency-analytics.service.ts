import { BaseService } from './base.service';
import { AdvancedConstituencyAnalytics } from '../types/analytics-workspace.schema';
import { getTrendModelingService, TrendDataPoint } from './trend-modeling.service';

export class ConstituencyAnalyticsService extends BaseService {
  private trendService = getTrendModelingService();

  // Mock historical data - in production, this would query the database
  private mockHistoricalData: Map<string, any[]> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    this.mockHistoricalData.set('c1', [
      { year: 2014, winner: 'Jane Smith', party: 'BJP', turnout: 60.2, margin: 8.5, voteShare: 55.2 },
      { year: 2019, winner: 'Jane Smith', party: 'BJP', turnout: 63.2, margin: 5.2, voteShare: 53.4 },
      { year: 2024, winner: 'John Doe', party: 'INC', turnout: 65.5, margin: 2.3, voteShare: 52.3 },
    ]);

    this.mockHistoricalData.set('c2', [
      { year: 2014, winner: 'Bob Jones', party: 'BJP', turnout: 68.5, margin: 10.2, voteShare: 58.1 },
      { year: 2019, winner: 'Alice Johnson', party: 'BJP', turnout: 70.5, margin: 8.3, voteShare: 54.5 },
      { year: 2024, winner: 'Alice Johnson', party: 'BJP', turnout: 72.1, margin: 5.8, voteShare: 51.2 },
    ]);

    this.mockHistoricalData.set('c3', [
      { year: 2014, winner: 'Charlie Brown', party: 'INC', turnout: 62.8, margin: 3.1, voteShare: 51.5 },
      { year: 2019, winner: 'Charlie Brown', party: 'INC', turnout: 67.8, margin: 2.1, voteShare: 50.8 },
      { year: 2024, winner: 'Bob Williams', party: 'INC', turnout: 68.9, margin: 1.2, voteShare: 51.2 },
    ]);
  }

  /**
   * Generate advanced analytics for a constituency
   */
  async generateConstituencyAnalytics(
    constituencyId: string,
    constituencyName: string,
    state: string
  ): Promise<AdvancedConstituencyAnalytics> {
    const historicalData = this.mockHistoricalData.get(constituencyId) || [];

    // Historical performance
    const historicalPerformance = historicalData.map((d: any) => ({
      year: d.year,
      winner: d.winner,
      party: d.party,
      turnout: d.turnout,
      margin: d.margin,
      voteShare: d.voteShare,
    }));

    // Turnout trend analysis
    const turnoutTrend = this.analyzeTurnoutTrend(historicalData);

    // Competitiveness analysis
    const competitiveness = this.analyzeCompetitiveness(historicalData);

    // Swing pattern analysis
    const swingPattern = this.analyzeSwingPattern(historicalData);

    // Demographic correlation (mock data)
    const demographicInsights = this.generateDemographicInsights();

    // Predictive indicators
    const predictiveIndicators = this.calculatePredictiveIndicators(
      historicalData,
      competitiveness,
      swingPattern
    );

    return {
      constituencyId,
      constituencyName,
      state,
      historicalPerformance,
      turnoutTrend,
      competitiveness,
      swingPattern,
      demographicInsights,
      predictiveIndicators,
    };
  }

  /**
   * Analyze turnout trend
   */
  private analyzeTurnoutTrend(data: any[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    significance: 'high' | 'medium' | 'low';
  } {
    if (data.length < 2) {
      return { direction: 'stable', rate: 0, significance: 'low' };
    }

    const turnoutData: TrendDataPoint[] = data.map((d: any) => ({
      year: d.year,
      value: d.turnout,
    }));

    const trend = this.trendService.analyzeTrend(turnoutData);
    const significance: 'high' | 'medium' | 'low' =
      trend.significance > 0.7 ? 'high' : trend.significance > 0.4 ? 'medium' : 'low';

    return {
      direction: trend.direction,
      rate: trend.rate,
      significance,
    };
  }

  /**
   * Analyze competitiveness
   */
  private analyzeCompetitiveness(data: any[]): {
    current: number;
    historical: number;
    trend: 'more_competitive' | 'less_competitive' | 'stable';
    classification: 'safe' | 'competitive' | 'tossup';
  } {
    if (data.length === 0) {
      return { current: 0, historical: 0, trend: 'stable', classification: 'safe' };
    }

    const latest = data[data.length - 1];
    const current = latest.margin;
    const historical = data.reduce((sum: number, d: any) => sum + d.margin, 0) / data.length;

    // Classification
    let classification: 'safe' | 'competitive' | 'tossup';
    if (current > 10) classification = 'safe';
    else if (current > 5) classification = 'competitive';
    else classification = 'tossup';

    // Trend
    let trend: 'more_competitive' | 'less_competitive' | 'stable';
    if (current < historical - 2) trend = 'more_competitive';
    else if (current > historical + 2) trend = 'less_competitive';
    else trend = 'stable';

    return {
      current,
      historical,
      trend,
      classification,
    };
  }

  /**
   * Analyze swing pattern
   */
  private analyzeSwingPattern(data: any[]): {
    averageSwing: number;
    swingVolatility: number;
    swingDirection: 'consistent' | 'oscillating' | 'random';
    swingMagnitude: 'high' | 'medium' | 'low';
  } {
    if (data.length < 2) {
      return {
        averageSwing: 0,
        swingVolatility: 0,
        swingDirection: 'random',
        swingMagnitude: 'low',
      };
    }

    // Calculate swings
    const swings: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const swing = Math.abs(data[i].voteShare - data[i - 1].voteShare);
      swings.push(swing);
    }

    const averageSwing = swings.reduce((sum, s) => sum + s, 0) / swings.length;
    const swingVolatility = this.trendService.calculateVolatility(
      data.map((d: any, i) => ({ year: d.year, value: swings[i] || 0 }))
    ).standardDeviation;

    // Determine swing direction
    let swingDirection: 'consistent' | 'oscillating' | 'random';
    const positiveSwings = swings.filter(s => s > 2).length;
    const negativeSwings = swings.filter(s => s < -2).length;

    if (positiveSwings > swings.length * 0.6) swingDirection = 'consistent';
    else if (negativeSwings > swings.length * 0.6) swingDirection = 'consistent';
    else if (positiveSwings > 0 && negativeSwings > 0) swingDirection = 'oscillating';
    else swingDirection = 'random';

    // Determine swing magnitude
    let swingMagnitude: 'high' | 'medium' | 'low';
    if (averageSwing > 5) swingMagnitude = 'high';
    else if (averageSwing > 2) swingMagnitude = 'medium';
    else swingMagnitude = 'low';

    return {
      averageSwing,
      swingVolatility,
      swingDirection,
      swingMagnitude,
    };
  }

  /**
   * Generate demographic insights (mock data)
   */
  private generateDemographicInsights(): Array<{
    demographic: string;
    correlation: number;
    significance: number;
  }> {
    return [
      { demographic: 'Urban Population', correlation: 0.65, significance: 0.8 },
      { demographic: 'Median Income', correlation: 0.45, significance: 0.6 },
      { demographic: 'Education Level', correlation: 0.72, significance: 0.9 },
      { demographic: 'Age 18-35', correlation: 0.38, significance: 0.5 },
    ];
  }

  /**
   * Calculate predictive indicators
   */
  private calculatePredictiveIndicators(
    _data: any[],
    competitiveness: any,
    swingPattern: any
  ): {
    flipRisk: number;
    turnoutImpact: number;
    swingPotential: number;
  } {
    // Flip risk calculation
    let flipRisk = 0;
    if (competitiveness.classification === 'tossup') flipRisk = 0.8;
    else if (competitiveness.classification === 'competitive') flipRisk = 0.5;
    else if (competitiveness.trend === 'more_competitive') flipRisk += 0.2;
    if (swingPattern.swingMagnitude === 'high') flipRisk += 0.15;

    // Turnout impact
    const turnoutImpact = competitiveness.classification === 'tossup' ? 0.9 : 0.6;

    // Swing potential
    const swingPotential = swingPattern.swingMagnitude === 'high' ? 0.8 : swingPattern.swingMagnitude === 'medium' ? 0.5 : 0.3;

    return {
      flipRisk: Math.min(flipRisk, 1),
      turnoutImpact,
      swingPotential,
    };
  }

  /**
   * Generate batch analytics for multiple constituencies
   */
  async generateBatchAnalytics(
    constituencies: Array<{ id: string; name: string; state: string }>
  ): Promise<AdvancedConstituencyAnalytics[]> {
    const results: AdvancedConstituencyAnalytics[] = [];

    for (const constituency of constituencies) {
      try {
        const analytics = await this.generateConstituencyAnalytics(
          constituency.id,
          constituency.name,
          constituency.state
        );
        results.push(analytics);
      } catch (error) {
        this.logError(`Failed to generate analytics for ${constituency.name}`, error);
      }
    }

    return results;
  }

  /**
   * Get constituency ranking by metric
   */
  rankConstituencies(
    analytics: AdvancedConstituencyAnalytics[],
    metric: 'flipRisk' | 'turnoutImpact' | 'swingPotential' | 'competitiveness'
  ): Array<{ constituencyId: string; name: string; value: number; rank: number }> {
    const rankings = analytics.map((a) => ({
      constituencyId: a.constituencyId,
      name: a.constituencyName,
      value: metric === 'competitiveness' ? a.competitiveness.current : a.predictiveIndicators[metric],
    }));

    rankings.sort((a, b) => b.value - a.value);

    return rankings.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  /**
   * Find similar constituencies based on analytics
   */
  findSimilarConstituencies(
    targetConstituency: AdvancedConstituencyAnalytics,
    allAnalytics: AdvancedConstituencyAnalytics[],
    limit: number = 5
  ): Array<{ constituencyId: string; name: string; similarity: number }> {
    const similarities: Array<{ constituencyId: string; name: string; similarity: number }> = [];

    for (const analytics of allAnalytics) {
      if (analytics.constituencyId === targetConstituency.constituencyId) continue;

      // Calculate similarity based on multiple factors
      const turnoutDiff = Math.abs(analytics.turnoutTrend.rate - targetConstituency.turnoutTrend.rate);
      const competitivenessDiff = Math.abs(
        analytics.competitiveness.current - targetConstituency.competitiveness.current
      );
      const swingDiff = Math.abs(analytics.swingPattern.averageSwing - targetConstituency.swingPattern.averageSwing);

      const similarity = 1 - (turnoutDiff + competitivenessDiff + swingDiff) / 30; // Normalized

      similarities.push({
        constituencyId: analytics.constituencyId,
        name: analytics.constituencyName,
        similarity,
      });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }
}

// Singleton instance
let constituencyAnalyticsService: ConstituencyAnalyticsService | null = null;

export function getConstituencyAnalyticsService(): ConstituencyAnalyticsService {
  if (!constituencyAnalyticsService) {
    constituencyAnalyticsService = new ConstituencyAnalyticsService();
  }
  return constituencyAnalyticsService;
}
