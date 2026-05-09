import { BaseService } from './base.service';
import { AuditLog, AuditLogQuery } from '../types/admin.schema';

export class AuditLogService extends BaseService {
  // In-memory storage (in production, use database)
  private logs: AuditLog[] = [];

  constructor() {
    super();
    this.initializeMockLogs();
  }

  /**
   * Initialize mock audit logs
   */
  private initializeMockLogs(): void {
    const mockLogs: AuditLog[] = [
      {
        id: 'log-1',
        userId: 'user-1',
        action: 'user.created',
        resource: 'users',
        resourceId: 'user-3',
        details: { name: 'Regular User', email: 'user@votelens.ai' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-03-01T10:00:00Z'),
        severity: 'info',
      },
      {
        id: 'log-2',
        userId: 'user-2',
        action: 'dataset.uploaded',
        resource: 'datasets',
        resourceId: 'ds-2',
        details: { fileName: 'Election Data 2024.csv', fileSize: 5100000 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-03-05T14:30:00Z'),
        severity: 'info',
      },
      {
        id: 'log-3',
        userId: 'user-1',
        action: 'moderation.approved',
        resource: 'moderations',
        resourceId: 'mod-2',
        details: { datasetId: 'ds-2', reviewNotes: 'Dataset meets all compliance requirements' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-03-06T09:15:00Z'),
        severity: 'info',
      },
      {
        id: 'log-4',
        userId: 'user-3',
        action: 'login.failed',
        resource: 'auth',
        details: { reason: 'Invalid credentials' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-03-07T08:45:00Z'),
        severity: 'warning',
      },
      {
        id: 'log-5',
        userId: 'system',
        action: 'system.error',
        resource: 'system',
        details: { error: 'Database connection timeout', service: 'database' },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        timestamp: new Date('2024-03-08T12:00:00Z'),
        severity: 'error',
      },
    ];

    this.logs = mockLogs;
  }

  /**
   * Create audit log entry
   */
  createLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.logs.push(newLog);

    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    return newLog;
  }

  /**
   * Log user action
   */
  logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): AuditLog {
    return this.createLog({
      userId,
      action,
      resource,
      resourceId,
      details: details || {},
      severity,
    });
  }

  /**
   * Log system event
   */
  logSystemEvent(
    action: string,
    resource: string,
    details?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): AuditLog {
    return this.createLog({
      userId: 'system',
      action,
      resource,
      details: details || {},
      severity,
    });
  }

  /**
   * Get log by ID
   */
  getLogById(id: string): AuditLog | null {
    return this.logs.find(log => log.id === id) || null;
  }

  /**
   * Get logs with filters
   */
  getLogs(query: AuditLogQuery): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    let filtered = [...this.logs];

    if (query.userId) {
      filtered = filtered.filter(log => log.userId === query.userId);
    }

    if (query.action) {
      filtered = filtered.filter(log => log.action === query.action);
    }

    if (query.resource) {
      filtered = filtered.filter(log => log.resource === query.resource);
    }

    if (query.severity) {
      filtered = filtered.filter(log => log.severity === query.severity);
    }

    if (query.startDate) {
      filtered = filtered.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(log => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedLogs = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      logs: paginatedLogs,
      total,
      hasMore,
    };
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs by resource
   */
  getLogsByResource(resource: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.resource === resource)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: 'info' | 'warning' | 'error' | 'critical', limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): AuditLog[] {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get critical logs
   */
  getCriticalLogs(limit: number = 50): AuditLog[] {
    return this.logs
      .filter(log => log.severity === 'critical' || log.severity === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get log statistics
   */
  getLogStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const bySeverity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    let last24HoursCount = 0;
    let last7DaysCount = 0;

    this.logs.forEach(log => {
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }

      if (log.timestamp >= last24Hours) last24HoursCount++;
      if (log.timestamp >= last7Days) last7DaysCount++;
    });

    return {
      total: this.logs.length,
      bySeverity,
      byAction,
      byResource,
      byUser,
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
    };
  }

  /**
   * Get log trends
   */
  getLogTrends(days: number = 30): Array<{
    date: Date;
    total: number;
    bySeverity: Record<string, number>;
  }> {
    const trends: Array<{
      date: Date;
      total: number;
      bySeverity: Record<string, number>;
    }> = [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const byDate: Record<string, { total: number; bySeverity: Record<string, number> }> = {};

    this.logs.forEach(log => {
      if (log.timestamp >= cutoffDate) {
        const dateKey = log.timestamp.toISOString().split('T')[0];
        if (!byDate[dateKey]) {
          byDate[dateKey] = { total: 0, bySeverity: {} };
        }
        byDate[dateKey].total++;
        byDate[dateKey].bySeverity[log.severity] = (byDate[dateKey].bySeverity[log.severity] || 0) + 1;
      }
    });

    Object.keys(byDate).forEach(dateStr => {
      const dateKey = dateStr as string;
      trends.push({
        date: new Date(dateKey),
        total: byDate[dateKey].total,
        bySeverity: byDate[dateKey].bySeverity,
      });
    });

    return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Search logs
   */
  searchLogs(query: string, limit: number = 100): AuditLog[] {
    const lowerQuery = query.toLowerCase();
    return this.logs
      .filter(
        log =>
          log.action.toLowerCase().includes(lowerQuery) ||
          log.resource.toLowerCase().includes(lowerQuery) ||
          JSON.stringify(log.details).toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Export logs to CSV
   */
  exportLogsToCSV(query?: AuditLogQuery): string {
    const { logs } = this.getLogs(query || {});
    const headers = ['ID', 'User ID', 'Action', 'Resource', 'Resource ID', 'Timestamp', 'Severity', 'IP Address', 'User Agent'];
    const rows = logs.map(log => [
      log.id,
      log.userId,
      log.action,
      log.resource,
      log.resourceId || 'N/A',
      log.timestamp.toISOString(),
      log.severity,
      log.ipAddress || 'N/A',
      log.userAgent || 'N/A',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThanDays: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    const afterCount = this.logs.length;

    return beforeCount - afterCount;
  }

  /**
   * Get user activity timeline
   */
  getUserActivityTimeline(userId: string, limit: number = 50): Array<{
    timestamp: Date;
    action: string;
    resource: string;
    details: Record<string, any>;
  }> {
    const userLogs = this.getLogsByUser(userId, limit * 2);

    return userLogs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      resource: log.resource,
      details: log.details,
    }));
  }

  /**
   * Get resource activity timeline
   */
  getResourceActivityTimeline(resourceId: string, limit: number = 50): Array<{
    timestamp: Date;
    action: string;
    userId: string;
    details: Record<string, any>;
  }> {
    const resourceLogs = this.logs
      .filter(log => log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return resourceLogs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      userId: log.userId || 'system',
      details: log.details,
    }));
  }

  /**
   * Detect anomalies in logs
   */
  detectAnomalies(): Array<{
    type: string;
    description: string;
    count: number;
    affectedUsers: string[];
  }> {
    const anomalies: Array<{
      type: string;
      description: string;
      count: number;
      affectedUsers: string[];
    }> = [];

    // Detect failed logins
    const failedLogins = this.logs.filter(log => log.action === 'login.failed');
    if (failedLogins.length > 10) {
      const affectedUsers = [...new Set(failedLogins.map(log => log.userId).filter((u): u is string => u !== undefined))];
      anomalies.push({
        type: 'security',
        description: 'High number of failed login attempts',
        count: failedLogins.length,
        affectedUsers,
      });
    }

    // Detect errors
    const errors = this.logs.filter(log => log.severity === 'error' || log.severity === 'critical');
    if (errors.length > 5) {
      const affectedUsers = [...new Set(errors.map(log => log.userId).filter((u): u is string => u !== undefined))];
      anomalies.push({
        type: 'system',
        description: 'High number of system errors',
        count: errors.length,
        affectedUsers,
      });
    }

    return anomalies;
  }
}

// Singleton instance
let auditLogService: AuditLogService | null = null;

export function getAuditLogService(): AuditLogService {
  if (!auditLogService) {
    auditLogService = new AuditLogService();
  }
  return auditLogService;
}
