import { BaseService } from './base.service';
import {
  SystemHealth,
  ServiceHealth,
  SystemMetrics,
  AIUsageMetrics,
  APIUsageMetrics,
  AnalyticsDashboard,
  UserAnalytics,
  DatasetAnalytics,
  AIAnalytics,
  APIAnalytics,
  SystemAnalytics,
  MonitoringQuery,
} from '../types/admin.schema';

export class MonitoringService extends BaseService {
  private aiUsageMetrics: AIUsageMetrics[] = [];
  private apiUsageMetrics: APIUsageMetrics[] = [];
  private startTime: Date = new Date();

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const services = await this.checkAllServices();
    const metrics = await this.getSystemMetrics();
    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      metrics,
    };
  }

  /**
   * Check all services
   */
  private async checkAllServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Database service
    services.push(await this.checkDatabase());

    // AI service
    services.push(await this.checkAIService());

    // Storage service
    services.push(await this.checkStorage());

    // Cache service
    services.push(await this.checkCache());

    // API service
    services.push(await this.checkAPI());

    return services;
  }

  /**
   * Check database service
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      // Simulate database health check
      // In production, this would actually query the database
      const latency = Math.random() * 50 + 10;
      
      return {
        name: 'database',
        status: 'healthy',
        latency,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'down',
        lastCheck: new Date(),
        error: 'Database connection failed',
        uptime: 0,
      };
    }
  }

  /**
   * Check AI service
   */
  private async checkAIService(): Promise<ServiceHealth> {
    try {
      // Simulate AI service health check
      const latency = Math.random() * 100 + 50;
      const isHealthy = Math.random() > 0.1; // 90% healthy

      return {
        name: 'ai',
        status: isHealthy ? 'healthy' : 'degraded',
        latency,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      return {
        name: 'ai',
        status: 'down',
        lastCheck: new Date(),
        error: 'AI service unavailable',
        uptime: 0,
      };
    }
  }

  /**
   * Check storage service
   */
  private async checkStorage(): Promise<ServiceHealth> {
    try {
      const latency = Math.random() * 30 + 5;

      return {
        name: 'storage',
        status: 'healthy',
        latency,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'down',
        lastCheck: new Date(),
        error: 'Storage service unavailable',
        uptime: 0,
      };
    }
  }

  /**
   * Check cache service
   */
  private async checkCache(): Promise<ServiceHealth> {
    try {
      const latency = Math.random() * 10 + 2;

      return {
        name: 'cache',
        status: 'healthy',
        latency,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'degraded',
        lastCheck: new Date(),
        error: 'Cache service degraded',
        uptime: Date.now() - this.startTime.getTime(),
      };
    }
  }

  /**
   * Check API service
   */
  private async checkAPI(): Promise<ServiceHealth> {
    try {
      const latency = Math.random() * 20 + 5;

      return {
        name: 'api',
        status: 'healthy',
        latency,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      return {
        name: 'api',
        status: 'down',
        lastCheck: new Date(),
        error: 'API service unavailable',
        uptime: 0,
      };
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    // Simulate system metrics
    return {
      cpu: {
        usage: Math.random() * 30 + 10,
        cores: 4,
      },
      memory: {
        used: 2.5 * 1024 * 1024 * 1024,
        total: 8 * 1024 * 1024 * 1024,
        percentage: 31.25,
      },
      disk: {
        used: 100 * 1024 * 1024 * 1024,
        total: 500 * 1024 * 1024 * 1024,
        percentage: 20,
      },
      network: {
        inbound: Math.random() * 1024 * 1024,
        outbound: Math.random() * 1024 * 1024,
      },
      database: {
        connections: Math.floor(Math.random() * 50) + 10,
        active: Math.floor(Math.random() * 20) + 5,
        idle: Math.floor(Math.random() * 30) + 5,
      },
    };
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'down' {
    const downCount = services.filter(s => s.status === 'down').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    if (downCount > 0) return 'down';
    if (degradedCount > 1) return 'degraded';
    return 'healthy';
  }

  /**
   * Record AI usage metrics
   */
  recordAIUsage(metrics: Omit<AIUsageMetrics, 'timestamp'>): void {
    const record: AIUsageMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.aiUsageMetrics.push(record);

    // Keep only last 10000 records
    if (this.aiUsageMetrics.length > 10000) {
      this.aiUsageMetrics = this.aiUsageMetrics.slice(-10000);
    }
  }

  /**
   * Get AI usage metrics
   */
  getAIUsageMetrics(query: MonitoringQuery): AIUsageMetrics[] {
    let filtered = [...this.aiUsageMetrics];

    if (query.userId) {
      filtered = filtered.filter(m => m.userId === query.userId);
    }

    if (query.endpoint) {
      filtered = filtered.filter(m => m.endpoint === query.endpoint);
    }

    if (query.model) {
      filtered = filtered.filter(m => m.model === query.model);
    }

    if (query.startDate) {
      filtered = filtered.filter(m => m.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(m => m.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get AI analytics
   */
  getAIAnalytics(startDate: Date, endDate: Date): AIAnalytics {
    const filtered = this.aiUsageMetrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    const totalRequests = filtered.length;
    const successfulRequests = filtered.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageLatency = totalRequests > 0
      ? filtered.reduce((sum, m) => sum + m.latency, 0) / totalRequests
      : 0;
    const totalTokens = filtered.reduce((sum, m) => sum + m.totalTokens, 0);

    // Group by model
    const byModel: Record<string, { requests: number; tokens: number; latency: number }> = {};
    filtered.forEach(m => {
      if (!byModel[m.model]) {
        byModel[m.model] = { requests: 0, tokens: 0, latency: 0 };
      }
      byModel[m.model].requests++;
      byModel[m.model].tokens += m.totalTokens;
      byModel[m.model].latency += m.latency;
    });

    // Calculate averages per model
    Object.keys(byModel).forEach(model => {
      byModel[model].latency = byModel[model].latency / byModel[model].requests;
    });

    // Group by endpoint
    const byEndpoint: Record<string, { requests: number; tokens: number; latency: number }> = {};
    filtered.forEach(m => {
      if (!byEndpoint[m.endpoint]) {
        byEndpoint[m.endpoint] = { requests: 0, tokens: 0, latency: 0 };
      }
      byEndpoint[m.endpoint].requests++;
      byEndpoint[m.endpoint].tokens += m.totalTokens;
      byEndpoint[m.endpoint].latency += m.latency;
    });

    // Calculate averages per endpoint
    Object.keys(byEndpoint).forEach(endpoint => {
      byEndpoint[endpoint].latency = byEndpoint[endpoint].latency / byEndpoint[endpoint].requests;
    });

    return {
      totalRequests,
      successRate,
      averageLatency,
      totalTokens,
      byModel,
      byEndpoint,
    };
  }

  /**
   * Record API usage metrics
   */
  recordAPIUsage(metrics: Omit<APIUsageMetrics, 'timestamp'>): void {
    const record: APIUsageMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.apiUsageMetrics.push(record);

    // Keep only last 10000 records
    if (this.apiUsageMetrics.length > 10000) {
      this.apiUsageMetrics = this.apiUsageMetrics.slice(-10000);
    }
  }

  /**
   * Get API usage metrics
   */
  getAPIUsageMetrics(query: MonitoringQuery): APIUsageMetrics[] {
    let filtered = [...this.apiUsageMetrics];

    if (query.userId) {
      filtered = filtered.filter(m => m.userId === query.userId);
    }

    if (query.endpoint) {
      filtered = filtered.filter(m => m.endpoint === query.endpoint);
    }

    if (query.startDate) {
      filtered = filtered.filter(m => m.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(m => m.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get API analytics
   */
  getAPIAnalytics(startDate: Date, endDate: Date): APIAnalytics {
    const filtered = this.apiUsageMetrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    const totalRequests = filtered.length;
    const successfulRequests = filtered.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0
      ? filtered.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
      : 0;

    // Group by endpoint
    const byEndpoint: Record<string, { requests: number; successRate: number; avgResponseTime: number }> = {};
    filtered.forEach(m => {
      if (!byEndpoint[m.endpoint]) {
        byEndpoint[m.endpoint] = { requests: 0, successRate: 0, avgResponseTime: 0 };
      }
      byEndpoint[m.endpoint].requests++;
      byEndpoint[m.endpoint].successRate += m.success ? 1 : 0;
      byEndpoint[m.endpoint].avgResponseTime += m.responseTime;
    });

    // Calculate averages per endpoint
    Object.keys(byEndpoint).forEach(endpoint => {
      byEndpoint[endpoint].successRate = (byEndpoint[endpoint].successRate / byEndpoint[endpoint].requests) * 100;
      byEndpoint[endpoint].avgResponseTime = byEndpoint[endpoint].avgResponseTime / byEndpoint[endpoint].requests;
    });

    // Group by status code
    const byStatusCode: Record<number, number> = {};
    filtered.forEach(m => {
      byStatusCode[m.statusCode] = (byStatusCode[m.statusCode] || 0) + 1;
    });

    // Error trend over time
    const errorTrend: Array<{ date: Date; count: number }> = [];
    const errorsByDate: Record<string, number> = {};
    filtered.filter(m => !m.success).forEach(m => {
      const dateKey = m.timestamp.toISOString().split('T')[0];
      errorsByDate[dateKey] = (errorsByDate[dateKey] || 0) + 1;
    });

    Object.keys(errorsByDate).forEach(dateStr => {
      errorTrend.push({ date: new Date(dateStr), count: errorsByDate[dateStr] });
    });

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      byEndpoint,
      byStatusCode,
      errorTrend,
    };
  }

  /**
   * Get analytics dashboard
   */
  async getAnalyticsDashboard(
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsDashboard> {
    return {
      period,
      startDate,
      endDate,
      users: await this.getUserAnalytics(startDate, endDate),
      datasets: await this.getDatasetAnalytics(startDate, endDate),
      ai: this.getAIAnalytics(startDate, endDate),
      api: this.getAPIAnalytics(startDate, endDate),
      system: await this.getSystemAnalytics(startDate, endDate),
    };
  }

  /**
   * Get user analytics
   */
  private async getUserAnalytics(startDate: Date, endDate: Date): Promise<UserAnalytics> {
    // Mock data - in production, this would query the user database
    return {
      total: 150,
      active: 120,
      new: 25,
      suspended: 5,
      byRole: {
        admin: 5,
        analyst: 30,
        user: 100,
        guest: 15,
      },
      loginTrend: this.generateTrendData(startDate, endDate),
    };
  }

  /**
   * Get dataset analytics
   */
  private async getDatasetAnalytics(startDate: Date, endDate: Date): Promise<DatasetAnalytics> {
    // Mock data - in production, this would query the dataset database
    return {
      total: 500,
      pending: 20,
      approved: 450,
      rejected: 20,
      flagged: 10,
      uploadTrend: this.generateTrendData(startDate, endDate),
    };
  }

  /**
   * Get system analytics
   */
  private async getSystemAnalytics(startDate: Date, endDate: Date): Promise<SystemAnalytics> {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeDays = uptime / (1000 * 60 * 60 * 24);

    return {
      uptime: uptimeDays,
      averageCpu: 25,
      averageMemory: 35,
      averageDisk: 22,
      incidents: 3,
      incidentTrend: this.generateTrendData(startDate, endDate),
    };
  }

  /**
   * Generate trend data
   */
  private generateTrendData(startDate: Date, endDate: Date): Array<{ date: Date; count: number }> {
    const trend: Array<{ date: Date; count: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      trend.push({
        date: new Date(current),
        count: Math.floor(Math.random() * 50) + 10,
      });
      current.setDate(current.getDate() + 1);
    }

    return trend;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.aiUsageMetrics = this.aiUsageMetrics.filter(m => m.timestamp > cutoffDate);
    this.apiUsageMetrics = this.apiUsageMetrics.filter(m => m.timestamp > cutoffDate);
  }
}

// Singleton instance
let monitoringService: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}
