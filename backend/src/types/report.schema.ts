/**
 * Report and Export Schema
 * Defines types for reporting and export functionality
 */

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  templateId: string;
  format: 'pdf' | 'csv' | 'png';
  branding?: ReportBranding;
  dataScope: ReportDataScope;
  includeCharts: boolean;
  includeExecutiveSummary: boolean;
  includeRecommendations: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportBranding {
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  footer?: string;
  header?: string;
}

export interface ReportDataScope {
  electionIds?: string[];
  constituencyIds?: string[];
  stateIds?: string[];
  partyIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive_summary' | 'constituency_report' | 'analytics_report' | 'comparison_report' | 'custom';
  sections: ReportSection[];
  defaultBranding?: ReportBranding;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'summary' | 'recommendations';
  title: string;
  order: number;
  config: SectionConfig;
  isVisible: boolean;
}

export interface SectionConfig {
  // Text sections
  content?: string;
  
  // Chart sections
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  chartDataSource?: string;
  chartOptions?: any;
  
  // Table sections
  columns?: string[];
  tableDataSource?: string;
  
  // Summary sections
  summaryType?: 'key_findings' | 'executive_summary' | 'data_summary';
  
  // Image sections
  imageUrl?: string;
  caption?: string;
}

export interface ExecutiveSummary {
  title: string;
  overview: string;
  keyFindings: KeyFinding[];
  recommendations: Recommendation[];
  conclusion: string;
  generatedAt: Date;
  aiGenerated: boolean;
}

export interface KeyFinding {
  id: string;
  category: 'performance' | 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  supportingData: any;
  impact: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  title: string;
  description: string;
  actionItems: string[];
  expectedOutcome: string;
}

export interface ExportRequest {
  reportConfig: ReportConfig;
  data: any;
  template?: ReportTemplate;
}

export interface ExportResult {
  id: string;
  format: 'pdf' | 'csv' | 'png';
  url: string;
  expiresAt: Date;
  size: number;
  pageCount?: number;
  metadata: {
    generatedAt: Date;
    processingTime: number;
    dataPoints: number;
  };
}

export interface ChartExportConfig {
  chartId: string;
  format: 'png' | 'svg' | 'pdf';
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  backgroundColor?: string;
  includeLegend?: boolean;
  includeTitle?: boolean;
}

export interface ChartExportResult {
  id: string;
  format: string;
  url: string;
  expiresAt: Date;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ConstituencyReportData {
  constituencyId: string;
  constituencyName: string;
  state: string;
  electionData: ElectionData[];
  performanceMetrics: PerformanceMetrics;
  trends: TrendData[];
  demographics: DemographicData;
  comparisons: ComparisonData;
}

export interface ElectionData {
  year: number;
  winner: string;
  party: string;
  turnout: number;
  margin: number;
  voteShare: number;
  totalVotes: number;
}

export interface PerformanceMetrics {
  averageTurnout: number;
  averageMargin: number;
  competitiveness: 'safe' | 'competitive' | 'tossup';
  trendDirection: 'improving' | 'declining' | 'stable';
  swingAnalysis: SwingAnalysis;
}

export interface SwingAnalysis {
  averageSwing: number;
  swingVolatility: number;
  swingDirection: 'consistent' | 'oscillating';
}

export interface TrendData {
  metric: string;
  values: Array<{
    year: number;
    value: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  rate: number;
}

export interface DemographicData {
  urbanRuralMix: 'urban' | 'rural' | 'mixed';
  incomeLevel: 'low' | 'medium' | 'high';
  educationLevel: 'low' | 'medium' | 'high';
  ageDemographics: {
    range: string;
    percentage: number;
  }[];
}

export interface ComparisonData {
  vsNational: {
    turnoutDifference: number;
    marginDifference: number;
  };
  vsState: {
    turnoutDifference: number;
    marginDifference: number;
  };
  vsSimilarConstituencies: {
    averageTurnout: number;
    averageMargin: number;
  };
}

export interface ReportGenerationOptions {
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeFooter: boolean;
  watermark?: string;
  password?: string;
  compression?: 'none' | 'low' | 'medium' | 'high';
}

export interface ReportSchedule {
  id: string;
  reportConfigId: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recipients: string[];
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
}

export interface ReportHistory {
  id: string;
  reportConfigId: string;
  generatedAt: Date;
  generatedBy: string;
  format: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}
