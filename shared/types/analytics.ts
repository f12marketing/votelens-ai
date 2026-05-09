export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  period: string;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface ComparisonData {
  label: string;
  value: number;
  color?: string;
}

export interface DemographicData {
  category: string;
  value: number;
  percentage: number;
}

export interface GeographicData {
  region: string;
  value: number;
  coordinates?: [number, number];
}

export interface AnalyticsFilters {
  electionId?: string;
  dateFrom?: string;
  dateTo?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
}

export interface AnalyticsResponse {
  metrics: AnalyticsMetric[];
  trends: TrendData[];
  comparisons: ComparisonData[];
  demographics: DemographicData[];
  geographic: GeographicData[];
}
