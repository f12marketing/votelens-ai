/**
 * Admin Management Schema
 * Defines types for admin management system including RBAC, monitoring, and audit trails
 */

import { UserRole } from './index';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: {
    department?: string;
    location?: string;
    phone?: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: 'users' | 'datasets' | 'analytics' | 'reports' | 'system' | 'api';
}

export interface DatasetModeration {
  id: string;
  datasetId: string;
  datasetName: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationType: 'content' | 'quality' | 'compliance' | 'security';
  flags: ModerationFlag[];
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  metadata?: {
    fileSize: number;
    recordCount: number;
    fileFormat: string;
  };
}

export interface ModerationFlag {
  id: string;
  type: 'data_quality' | 'compliance' | 'security' | 'content' | 'format';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  field?: string;
  value?: any;
}

export interface AIUsageMetrics {
  userId?: string;
  timestamp: Date;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
  success: boolean;
  error?: string;
  cached: boolean;
}

export interface APIUsageMetrics {
  endpoint: string;
  method: string;
  timestamp: Date;
  userId?: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ipAddress?: string;
  success: boolean;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  services: ServiceHealth[];
  metrics: SystemMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastCheck: Date;
  error?: string;
  uptime: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  database: {
    connections: number;
    active: number;
    idle: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AnalyticsDashboard {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  users: UserAnalytics;
  datasets: DatasetAnalytics;
  ai: AIAnalytics;
  api: APIAnalytics;
  system: SystemAnalytics;
}

export interface UserAnalytics {
  total: number;
  active: number;
  new: number;
  suspended: number;
  byRole: Record<UserRole, number>;
  loginTrend: Array<{
    date: Date;
    count: number;
  }>;
}

export interface DatasetAnalytics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  uploadTrend: Array<{
    date: Date;
    count: number;
  }>;
}

export interface AIAnalytics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  totalTokens: number;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    latency: number;
  }>;
  byEndpoint: Record<string, {
    requests: number;
    tokens: number;
    latency: number;
  }>;
}

export interface APIAnalytics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  byEndpoint: Record<string, {
    requests: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  byStatusCode: Record<number, number>;
  errorTrend: Array<{
    date: Date;
    count: number;
  }>;
}

export interface SystemAnalytics {
  uptime: number;
  averageCpu: number;
  averageMemory: number;
  averageDisk: number;
  incidents: number;
  incidentTrend: Array<{
    date: Date;
    count: number;
  }>;
}

export interface UserManagementRequest {
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
  metadata?: {
    department?: string;
    location?: string;
    phone?: string;
  };
}

export interface UserUpdateRequest {
  name?: string;
  role?: UserRole;
  permissions?: string[];
  status?: 'active' | 'suspended' | 'pending';
  metadata?: {
    department?: string;
    location?: string;
    phone?: string;
  };
}

export interface RoleManagementRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface ModerationRequest {
  status: 'approved' | 'rejected' | 'flagged';
  reviewNotes?: string;
}

export interface MonitoringQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  endpoint?: string;
  model?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  limit?: number;
  offset?: number;
}
