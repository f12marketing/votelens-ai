export enum InsightType {
  TREND = 'TREND',
  PREDICTION = 'PREDICTION',
  ANOMALY = 'ANOMALY',
  COMPARISON = 'COMPARISON',
  DEMOGRAPHIC = 'DEMOGRAPHIC',
  GEOGRAPHIC = 'GEOGRAPHIC',
}

export enum InsightStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Insight {
  id: string;
  electionId: string;
  type: InsightType;
  title: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
  status: InsightStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInsightDto {
  electionId: string;
  type: InsightType;
  title: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}
