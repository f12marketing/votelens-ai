/**
 * Historical Election Comparison Schema
 * Defines types for comparing elections across years
 */

export interface ElectionComparison {
  electionId1: string;
  electionId2: string;
  year1: number;
  year2: number;
  voteShareChanges: VoteShareChange[];
  turnoutShifts: TurnoutShift[];
  partyPerformanceChanges: PartyPerformanceChange[];
  constituencySwings: ConstituencySwing[];
  regionalComparisons: RegionalComparison[];
  summary: ComparisonSummary;
}

export interface VoteShareChange {
  party: string;
  year1Share: number;
  year2Share: number;
  change: number;
  changePercentage: number;
  trend: 'gaining' | 'losing' | 'stable';
  seatsChange?: number;
}

export interface TurnoutShift {
  constituencyId: string;
  constituencyName: string;
  state: string;
  year1Turnout: number;
  year2Turnout: number;
  change: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  totalVotersChange?: number;
}

export interface PartyPerformanceChange {
  party: string;
  year1Seats: number;
  year2Seats: number;
  seatsChange: number;
  year1VoteShare: number;
  year2VoteShare: number;
  voteShareChange: number;
  performance: 'improving' | 'declining' | 'stable';
  keyGains?: string[];
  keyLosses?: string[];
}

export interface ConstituencySwing {
  constituencyId: string;
  constituencyName: string;
  state: string;
  year1Winner: string;
  year1Party: string;
  year1Margin: number;
  year2Winner: string;
  year2Party: string;
  year2Margin: number;
  swing: number;
  flipped: boolean;
  swingType: 'toward_party' | 'away_from_party' | 'neutral';
  demographicChanges?: DemographicChange[];
}

export interface DemographicChange {
  demographic: string;
  year1Value: number;
  year2Value: number;
  change: number;
}

export interface RegionalComparison {
  region: string;
  year1Turnout: number;
  year2Turnout: number;
  turnoutChange: number;
  year1WinningParty: string;
  year2WinningParty: string;
  partyChange: boolean;
  year1VoteShareDistribution: PartyVoteShare[];
  year2VoteShareDistribution: PartyVoteShare[];
  swing: number;
}

export interface PartyVoteShare {
  party: string;
  voteShare: number;
}

export interface ComparisonSummary {
  overallTurnoutChange: number;
  overallTurnoutChangePercentage: number;
  totalFlippedConstituencies: number;
  biggestGainer: string;
  biggestLoser: string;
  averageSwing: number;
  keyInsights: string[];
}

export interface ComparisonFilter {
  state?: string[];
  party?: string[];
  constituencyId?: string[];
  region?: string[];
  minSwing?: number;
  maxSwing?: number;
  flippedOnly?: boolean;
  turnoutChangeRange?: { min: number; max: number };
  voteShareChangeRange?: { min: number; max: number };
}

export interface ComparisonRequest {
  electionId1: string;
  electionId2: string;
  filters?: ComparisonFilter;
  includeCharts?: boolean;
  includeAI?: boolean;
}

export interface ComparisonResponse {
  comparison: ElectionComparison;
  charts?: ChartConfig[];
  aiSummary?: string;
  metadata: ComparisonMetadata;
}

export interface ComparisonMetadata {
  processingTime: number;
  dataPoints: number;
  filtersApplied: boolean;
  comparisonYears: [number, number];
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }>;
  };
  options?: any;
}

export interface HistoricalTrend {
  year: number;
  turnout: number;
  winningParty: string;
  voteShareDistribution: PartyVoteShare[];
  totalVotes: number;
  totalConstituencies: number;
}

export interface TrendAnalysis {
  party: string;
  trend: 'upward' | 'downward' | 'stable' | 'volatile';
  startValue: number;
  endValue: number;
  totalChange: number;
  averageChangePerYear: number;
  years: number[];
  values: number[];
  peakYear?: number;
  peakValue?: number;
  troughYear?: number;
  troughValue?: number;
}

export interface MultiElectionComparison {
  electionIds: string[];
  years: number[];
  voteShareTrends: TrendAnalysis[];
  turnoutTrend: TrendAnalysis;
  partyPerformanceHistory: PartyPerformanceHistory[];
  constituencySwingHistory: ConstituencySwingHistory[];
}

export interface PartyPerformanceHistory {
  party: string;
  yearlyPerformance: Array<{
    year: number;
    voteShare: number;
    seats: number;
    margin: number;
  }>;
}

export interface ConstituencySwingHistory {
  constituencyId: string;
  constituencyName: string;
  state: string;
  yearlySwings: Array<{
    year: number;
    winner: string;
    party: string;
    margin: number;
    swing: number;
  }>;
  swingPattern: 'conservative' | 'swing' | 'safe' | 'volatile';
}
