/**
 * Insight Generation Schema
 * Defines structured output for AI-generated election insights
 */

export interface Insight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  summary: string;
  details: string;
  confidence: number; // 0-1
  impact: number; // 0-10
  relevance: number; // 0-10
  dataPoints: DataPoint[];
  recommendations?: string[];
  relatedInsights?: string[];
  metadata: InsightMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type InsightType = 
  | 'summary'
  | 'anomaly'
  | 'trend'
  | 'movement'
  | 'comparative'
  | 'prediction'
  | 'explanation';

export type InsightCategory =
  | 'turnout'
  | 'vote_share'
  | 'margin'
  | 'regional'
  | 'demographic'
  | 'party_performance'
  | 'constituency'
  | 'strategic';

export type InsightPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export interface DataPoint {
  label: string;
  value: number | string;
  context?: string;
  source?: string;
}

export interface InsightMetadata {
  electionId: string;
  constituencyId?: string;
  state?: string;
  region?: string;
  party?: string;
  metric: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  generatedBy: string; // 'ai' or 'manual'
  model?: string;
  promptTemplate?: string;
  processingTime?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface InsightGenerationRequest {
  electionId: string;
  metrics: ElectionMetrics;
  turnoutData: TurnoutData;
  historicalData?: HistoricalData;
  regionalAnalytics?: RegionalAnalytics;
  constituencyId?: string;
  state?: string;
  insightTypes?: InsightType[];
  categories?: InsightCategory[];
  maxInsights?: number;
  minConfidence?: number;
  includeRecommendations?: boolean;
}

export interface ElectionMetrics {
  totalConstituencies: number;
  totalVotes: number;
  overallTurnout: number;
  winningParty: string;
  winningMargin: number;
  voteShareDistribution: PartyVoteShare[];
  seatDistribution: PartySeatDistribution;
  closeContests: number;
  swingConstituencies: number;
}

export interface PartyVoteShare {
  party: string;
  voteShare: number;
  change?: number;
}

export interface PartySeatDistribution {
  party: string;
  seats: number;
  change?: number;
}

export interface TurnoutData {
  overall: number;
  byState: StateTurnout[];
  byConstituency: ConstituencyTurnout[];
  byDemographic?: DemographicTurnout[];
}

export interface StateTurnout {
  state: string;
  turnout: number;
  change?: number;
  totalVoters: number;
}

export interface ConstituencyTurnout {
  constituencyId: string;
  constituencyName: string;
  turnout: number;
  change?: number;
  totalVoters: number;
}

export interface DemographicTurnout {
  demographic: string;
  turnout: number;
  change?: number;
}

export interface HistoricalData {
  previousElection: {
    year: number;
    overallTurnout: number;
    voteShareDistribution: PartyVoteShare[];
    seatDistribution: PartySeatDistribution[];
  };
  trendData?: TrendData[];
}

export interface TrendData {
  year: number;
  metric: string;
  value: number;
}

export interface RegionalAnalytics {
  region: string;
  voteShare: PartyVoteShare[];
  turnout: number;
  dominantParty: string;
  swing: number;
  keyConstituencies: string[];
}

export interface InsightGenerationResponse {
  success: boolean;
  insights: Insight[];
  summary: string;
  totalGenerated: number;
  processingTime: number;
  metadata: {
    model: string;
    promptTemplates: string[];
    avgConfidence: number;
    avgImpact: number;
  };
}

export interface InsightRankingCriteria {
  confidence: number; // Weight: 0-1
  impact: number; // Weight: 0-1
  relevance: number; // Weight: 0-1
  recency: number; // Weight: 0-1
  uniqueness: number; // Weight: 0-1
}

export interface InsightFilter {
  type?: InsightType[];
  category?: InsightCategory[];
  priority?: InsightPriority[];
  minConfidence?: number;
  minImpact?: number;
  state?: string[];
  party?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface InsightAggregation {
  byType: Record<InsightType, number>;
  byCategory: Record<InsightCategory, number>;
  byPriority: Record<InsightPriority, number>;
  avgConfidence: number;
  avgImpact: number;
  totalInsights: number;
}
