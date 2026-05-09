/**
 * Advanced Analytics Workspace Schema
 * Defines types for professional election analytics workspace
 */

export interface AdvancedAnalyticsFilter {
  // Geographic filters
  states?: string[];
  constituencies?: string[];
  regions?: string[];
  districts?: string[];

  // Election filters
  electionIds?: string[];
  electionYears?: number[];

  // Party filters
  parties?: string[];
  partyCategories?: ('national' | 'regional' | 'independent')[];
  excludeParties?: string[];

  // Performance filters
  turnoutRange?: { min: number; max: number };
  marginRange?: { min: number; max: number };
  voteShareRange?: { min: number; max: number };
  swingRange?: { min: number; max: number };

  // Outcome filters
  outcomes?: ('won' | 'lost' | 'contested')[];
  flippedOnly?: boolean;
  closeRacesOnly?: boolean;

  // Demographic filters
  urbanRuralMix?: ('urban' | 'rural' | 'mixed')[];
  incomeLevel?: ('low' | 'medium' | 'high')[];
  educationLevel?: ('low' | 'medium' | 'high')[];
  ageDemographics?: { min: number; max: number };

  // Time-based filters
  dateRange?: { start: Date; end: Date };
  relativeTimeRange?: ('last_1_year' | 'last_5_years' | 'last_10_years' | 'all_time');

  // Advanced filters
  competitiveness?: ('safe' | 'competitive' | 'tossup')[];
  incumbency?: ('incumbent' | 'challenger' | 'open_seat')[];
  candidateType?: ('newcomer' | 'veteran' | 'returning')[];
}

export interface TrendModel {
  id: string;
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic';
  dataSource: 'vote_share' | 'turnout' | 'margin' | 'swing';
  timeframe: { start: number; end: number };
  parameters: {
    slope?: number;
    intercept?: number;
    r_squared?: number;
    confidence?: number;
  };
  predictions: Array<{
    year: number;
    predicted: number;
    confidence: number;
  }>;
  anomalies: Array<{
    year: number;
    actual: number;
    predicted: number;
    deviation: number;
  }>;
}

export interface AdvancedConstituencyAnalytics {
  constituencyId: string;
  constituencyName: string;
  state: string;

  // Historical performance
  historicalPerformance: Array<{
    year: number;
    winner: string;
    party: string;
    turnout: number;
    margin: number;
    voteShare: number;
  }>;

  // Trend analysis
  turnoutTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    significance: 'high' | 'medium' | 'low';
  };

  // Competitiveness analysis
  competitiveness: {
    current: number;
    historical: number;
    trend: 'more_competitive' | 'less_competitive' | 'stable';
    classification: 'safe' | 'competitive' | 'tossup';
  };

  // Swing analysis
  swingPattern: {
    averageSwing: number;
    swingVolatility: number;
    swingDirection: 'consistent' | 'oscillating' | 'random';
    swingMagnitude: 'high' | 'medium' | 'low';
  };

  // Demographic correlation
  demographicInsights: Array<{
    demographic: string;
    correlation: number;
    significance: number;
  }>;

  // Predictive indicators
  predictiveIndicators: {
    flipRisk: number;
    turnoutImpact: number;
    swingPotential: number;
  };
}

export interface WorkspaceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'monitor';

  // Data context
  affectedEntities: {
    constituencies?: string[];
    states?: string[];
    parties?: string[];
  };

  // Metrics
  metrics: {
    metric: string;
    value: number;
    change?: number;
    benchmark?: number;
  }[];

  // Recommendations
  recommendations: string[];

  // Supporting data
  supportingData: {
    chartType: string;
    data: any;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags: string[];
}

export interface AnalyticsWorkspace {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  // Configuration
  filters: AdvancedAnalyticsFilter;
  views: WorkspaceView[];

  // Data
  insights: WorkspaceInsight[];
  trendModels: TrendModel[];
  constituencyAnalytics: AdvancedConstituencyAnalytics[];

  // Summary
  summary: WorkspaceSummary;

  // Sharing
  isShared: boolean;
  sharedWith?: string[];
}

export interface WorkspaceView {
  id: string;
  name: string;
  type: 'dashboard' | 'comparison' | 'trend' | 'constituency' | 'regional';
  configuration: any;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible: boolean;
}

export interface WorkspaceSummary {
  totalInsights: number;
  highPriorityInsights: number;
  totalTrendModels: number;
  totalConstituencies: number;
  dataPoints: number;
  lastUpdated: Date;

  // Key metrics
  keyMetrics: {
    label: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];

  // Top insights
  topInsights: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'ppt';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRawData: boolean;
  includeRecommendations: boolean;
  dateRange?: { start: Date; end: Date };
  customTitle?: string;
  customSubtitle?: string;
  branding?: {
    logo?: string;
    colors?: string[];
  };
}

export interface ExportResult {
  id: string;
  format: string;
  url: string;
  expiresAt: Date;
  size: number;
  pageCount?: number;
}

export interface AnalyticsWorkspaceRequest {
  name: string;
  description?: string;
  filters: AdvancedAnalyticsFilter;
  views?: WorkspaceView[];
}

export interface AnalyticsWorkspaceResponse {
  workspace: AnalyticsWorkspace;
  metadata: {
    processingTime: number;
    dataSources: string[];
    refreshDate: Date;
  };
}
