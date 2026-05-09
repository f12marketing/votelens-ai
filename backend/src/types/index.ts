export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'user' | 'analyst' | 'admin';
  organization?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  token?: string;
}

export interface Election {
  id: string;
  name: string;
  description?: string;
  date: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Constituency {
  id: string;
  name: string;
  region: string;
  voterCount: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Upload {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt?: Date;
  createdAt?: Date;
  processedAt?: Date;
  electionId?: string;
  constituencyId?: string;
  rowCount?: number;
  metadata?: any;
}

export interface Insight {
  id: string;
  type: 'prediction' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  source: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  type: 'summary' | 'detailed' | 'custom';
  format: 'pdf' | 'csv' | 'json';
  status: 'generating' | 'ready' | 'failed';
  createdAt: Date;
  generatedAt?: Date;
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
}

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ANALYST = 'analyst',
  ADMIN = 'admin',
}

export enum ElectionStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum UploadStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportStatus {
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}
