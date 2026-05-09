# VoteLens AI - Production Diagnostics & Troubleshooting Guide

## Executive Summary

This guide provides comprehensive diagnostic procedures and troubleshooting steps for VoteLens AI production deployment on Railway, covering system health checks, performance analysis, and issue resolution.

---

## Table of Contents

1. [Diagnostic Tools Overview](#diagnostic-tools-overview)
2. [Health Check Procedures](#health-check-procedures)
3. [Performance Diagnostics](#performance-diagnostics)
4. [Database Diagnostics](#database-diagnostics)
5. [AI Service Diagnostics](#ai-service-diagnostics)
6. [Infrastructure Diagnostics](#infrastructure-diagnostics)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Emergency Procedures](#emergency-procedures)

---

## Diagnostic Tools Overview

### 1. Built-in Diagnostic Commands

```bash
# System health check
curl -f https://api.votelens.app/health || echo "API health check failed"

# Database health check
curl -f https://api.votelens.app/health/db || echo "Database health check failed"

# AI service health check
curl -f https://api.votelens.app/health/ai || echo "AI service health check failed"

# Cache health check
curl -f https://api.votelens.app/health/cache || echo "Cache health check failed"

# Full diagnostic report
curl -X POST https://api.votelens.app/admin/diagnostics \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Railway CLI Commands

```bash
# Check service status
railway status

# View service logs
railway logs

# View specific service logs
railway logs votelens-backend

# View environment variables
railway variables

# Restart service
railway restart

# Scale service
railway up --count 3
```

### 3. Database Diagnostic Queries

```sql
-- Check database connections
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting_connections
FROM pg_stat_activity 
WHERE datname = current_database();

-- Check slow queries
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time,
    rows
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 20;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## Health Check Procedures

### 1. Automated Health Check Script

```typescript
// src/diagnostics/health-check.script.ts
export class HealthCheckScript {
  private services: HealthCheckService[] = [];
  private results: HealthCheckResult[] = [];
  
  constructor() {
    this.setupHealthChecks();
  }
  
  private setupHealthChecks(): void {
    // API health check
    this.services.push(new APIHealthCheck({
      name: 'API Health',
      endpoint: '/health',
      timeout: 10000,
      expectedStatus: 200
    }));
    
    // Database health check
    this.services.push(new DatabaseHealthCheck({
      name: 'Database Health',
      connectionTimeout: 5000,
      queryTimeout: 10000
    }));
    
    // AI service health check
    this.services.push(new AIHealthCheck({
      name: 'AI Service Health',
      endpoint: '/health/ai',
      timeout: 15000,
      expectedStatus: 200
    }));
    
    // Cache health check
    this.services.push(new CacheHealthCheck({
      name: 'Cache Health',
      timeout: 5000,
      expectedResponseTime: 100
    }));
    
    // Memory health check
    this.services.push(new MemoryHealthCheck({
      name: 'Memory Health',
      threshold: 0.8 // 80% threshold
    }));
    
    // Disk health check
    this.services.push(new DiskHealthCheck({
      name: 'Disk Health',
      threshold: 0.9 // 90% threshold
    }));
  }
  
  async runFullDiagnostics(): Promise<DiagnosticReport> {
    console.log('Starting full health diagnostics...');
    
    const startTime = Date.now();
    
    // Run all health checks
    for (const service of this.services) {
      try {
        const result = await service.check();
        this.results.push(result);
        
        console.log(`${service.name}: ${result.status} (${result.duration}ms)`);
        if (result.status !== 'healthy') {
          console.error(`  ${result.message}`);
        }
        
      } catch (error) {
        const errorResult: HealthCheckResult = {
          name: service.name,
          status: 'error',
          message: error.message,
          duration: 0,
          timestamp: new Date()
        };
        
        this.results.push(errorResult);
        console.error(`${service.name}: ERROR - ${error.message}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Generate report
    const report = this.generateDiagnosticReport(duration);
    
    // Save report
    await this.saveDiagnosticReport(report);
    
    return report;
  }
  
  private generateDiagnosticReport(duration: number): DiagnosticReport {
    const healthyChecks = this.results.filter(r => r.status === 'healthy').length;
    const warningChecks = this.results.filter(r => r.status === 'warning').length;
    const errorChecks = this.results.filter(r => r.status === 'error').length;
    const criticalChecks = this.results.filter(r => r.status === 'critical').length;
    
    const overallStatus = criticalChecks > 0 ? 'critical' :
                        errorChecks > 0 ? 'error' :
                        warningChecks > 0 ? 'warning' : 'healthy';
    
    return {
      timestamp: new Date(),
      duration,
      overallStatus,
      summary: {
        total: this.results.length,
        healthy: healthyChecks,
        warning: warningChecks,
        error: errorChecks,
        critical: criticalChecks
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    for (const result of this.results) {
      if (result.status === 'warning') {
        recommendations.push(`${result.name}: ${result.recommendation}`);
      } else if (result.status === 'error' || result.status === 'critical') {
        recommendations.push(`${result.name}: ${result.recommendation} (URGENT)`);
      }
    }
    
    return recommendations;
  }
  
  private async saveDiagnosticReport(report: DiagnosticReport): Promise<void> {
    const filename = `diagnostic-report-${Date.now()}.json`;
    const filepath = path.join(process.cwd(), 'diagnostics', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`Diagnostic report saved to: ${filepath}`);
  }
}

// API health check implementation
class APIHealthCheck implements HealthCheckService {
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${process.env.API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'API Health',
          status: 'healthy',
          message: 'API is responding normally',
          duration,
          timestamp: new Date(),
          details: {
            statusCode: response.status,
            responseTime: duration
          }
        };
      } else {
        return {
          name: 'API Health',
          status: 'error',
          message: `API returned status ${response.status}`,
          duration,
          timestamp: new Date(),
          details: {
            statusCode: response.status,
            responseTime: duration
          }
        };
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        name: 'API Health',
        status: 'critical',
        message: `API is not responding: ${error.message}`,
        duration,
        timestamp: new Date(),
        details: {
          error: error.message,
          responseTime: duration
        }
      };
    }
  }
}
```

### 2. Real-time Health Monitoring

```typescript
// src/diagnostics/real-time-monitor.ts
export class RealTimeHealthMonitor {
  private websocket: WebSocket;
  private healthDashboard: HealthDashboard;
  private alertThresholds = {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.8 // 80%
  };
  
  constructor() {
    this.healthDashboard = new HealthDashboard();
    this.connectWebSocket();
  }
  
  private connectWebSocket(): void {
    try {
      this.websocket = new WebSocket(process.env.HEALTH_WEBSOCKET_URL!);
      
      this.websocket.onopen = () => {
        console.log('Connected to health monitoring WebSocket');
        this.startRealTimeMonitoring();
      };
      
      this.websocket.onmessage = (event) => {
        const healthData = JSON.parse(event.data);
        this.processHealthUpdate(healthData);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        setTimeout(() => this.connectWebSocket(), 5000);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }
  
  private startRealTimeMonitoring(): void {
    // Request real-time health updates
    this.websocket.send(JSON.stringify({
      type: 'subscribe',
      channels: ['health', 'metrics', 'alerts']
    }));
  }
  
  private processHealthUpdate(data: any): void {
    switch (data.type) {
      case 'health_update':
        this.healthDashboard.updateHealthStatus(data.payload);
        break;
        
      case 'metrics_update':
        this.healthDashboard.updateMetrics(data.payload);
        this.checkThresholds(data.payload);
        break;
        
      case 'alert':
        this.healthDashboard.addAlert(data.payload);
        this.handleAlert(data.payload);
        break;
    }
  }
  
  private checkThresholds(metrics: any): void {
    // Check response time threshold
    if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
      this.triggerAlert({
        type: 'high_response_time',
        severity: 'warning',
        message: `Average response time is ${metrics.avgResponseTime}ms`,
        value: metrics.avgResponseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
    
    // Check error rate threshold
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      this.triggerAlert({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%`,
        value: metrics.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }
    
    // Check memory usage threshold
    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      this.triggerAlert({
        type: 'high_memory_usage',
        severity: 'warning',
        message: `Memory usage is ${(metrics.memoryUsage * 100).toFixed(2)}%`,
        value: metrics.memoryUsage,
        threshold: this.alertThresholds.memoryUsage
      });
    }
    
    // Check CPU usage threshold
    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      this.triggerAlert({
        type: 'high_cpu_usage',
        severity: 'warning',
        message: `CPU usage is ${(metrics.cpuUsage * 100).toFixed(2)}%`,
        value: metrics.cpuUsage,
        threshold: this.alertThresholds.cpuUsage
      });
    }
  }
  
  private triggerAlert(alert: Alert): void {
    // Send alert to WebSocket
    this.websocket.send(JSON.stringify({
      type: 'alert',
      payload: alert
    }));
    
    // Also log the alert
    console.warn(`ALERT: ${alert.type} - ${alert.message}`);
  }
  
  private handleAlert(alert: Alert): void {
    // Handle different alert types
    switch (alert.type) {
      case 'high_response_time':
        this.handleHighResponseTime(alert);
        break;
      case 'high_error_rate':
        this.handleHighErrorRate(alert);
        break;
      case 'high_memory_usage':
        this.handleHighMemoryUsage(alert);
        break;
      case 'high_cpu_usage':
        this.handleHighCPUUsage(alert);
        break;
    case 'service_down':
        this.handleServiceDown(alert);
        break;
    }
  }
  
  private handleHighResponseTime(alert: Alert): void {
    console.log(`High response time detected: ${alert.value}ms (threshold: ${alert.threshold}ms)`);
    
    // Potential actions:
    // 1. Check for slow queries
    // 2. Verify AI service performance
    // 3. Check network latency
    // 4. Consider scaling up
  }
  
  private handleHighErrorRate(alert: Alert): void {
    console.log(`High error rate detected: ${(alert.value * 100).toFixed(2)}% (threshold: ${(alert.threshold * 100).toFixed(2)}%)`);
    
    // Potential actions:
    // 1. Check application logs for errors
    // 2. Verify database connectivity
    // 3. Check AI service status
    // 4. Review recent deployments
  }
  
  private handleHighMemoryUsage(alert: Alert): void {
    console.log(`High memory usage detected: ${(alert.value * 100).toFixed(2)}% (threshold: ${(alert.threshold * 100).toFixed(2)}%)`);
    
    // Potential actions:
    // 1. Check for memory leaks
    // 2. Force garbage collection
    // 3. Restart service if necessary
    // 4. Consider increasing memory allocation
  }
  
  private handleHighCPUUsage(alert: Alert): void {
    console.log(`High CPU usage detected: ${(alert.value * 100).toFixed(2)}% (threshold: ${(alert.threshold * 100).toFixed(2)}%)`);
    
    // Potential actions:
    // 1. Check for infinite loops
    // 2. Monitor active processes
    // 3. Consider scaling up
    // 4. Review recent code changes
  }
  
  private handleServiceDown(alert: Alert): void {
    console.log(`Service down detected: ${alert.metadata?.service_name}`);
    
    // Potential actions:
    // 1. Check service logs
    // 2. Restart service
    // 3. Verify deployment
    // 4. Check infrastructure status
  }
}
```

---

## Performance Diagnostics

### 1. Performance Analysis Tool

```typescript
// src/diagnostics/performance-analyzer.ts
export class PerformanceAnalyzer {
  private metricsCollector: MetricsCollector;
  private analysisEngine: AnalysisEngine;
  
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.analysisEngine = new AnalysisEngine();
  }
  
  async analyzePerformance(timeRange: TimeRange): Promise<PerformanceAnalysis> {
    console.log(`Analyzing performance for ${timeRange.start} to ${timeRange.end}`);
    
    // Collect metrics
    const metrics = await this.metricsCollector.collectMetrics(timeRange);
    
    // Analyze different aspects
    const [
      apiAnalysis,
      databaseAnalysis,
      aiAnalysis,
      memoryAnalysis,
      cpuAnalysis
    ] = await Promise.all([
      this.analyzeAPIPerformance(metrics.api),
      this.analyzeDatabasePerformance(metrics.database),
      this.analyzeAIPerformance(metrics.ai),
      this.analyzeMemoryUsage(metrics.memory),
      this.analyzeCPUUsage(metrics.cpu)
    ]);
    
    // Generate overall analysis
    const overallAnalysis = this.generateOverallAnalysis({
      api: apiAnalysis,
      database: databaseAnalysis,
      ai: aiAnalysis,
      memory: memoryAnalysis,
      cpu: cpuAnalysis
    });
    
    return {
      timeRange,
      timestamp: new Date(),
      overall: overallAnalysis,
      api: apiAnalysis,
      database: databaseAnalysis,
      ai: aiAnalysis,
      memory: memoryAnalysis,
      cpu: cpuAnalysis,
      recommendations: this.generatePerformanceRecommendations(overallAnalysis)
    };
  }
  
  private async analyzeAPIPerformance(metrics: APIMetrics[]): Promise<APIPerformanceAnalysis> {
    const responseTimes = metrics.map(m => m.responseTime);
    const errorRates = metrics.map(m => m.errorRate);
    const throughput = metrics.map(m => m.throughput);
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = this.percentile(responseTimes, 95);
    const p99ResponseTime = this.percentile(responseTimes, 99);
    const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
    const avgThroughput = throughput.reduce((a, b) => a + b, 0) / throughput.length;
    
    // Identify trends
    const responseTimeTrend = this.calculateTrend(responseTimes);
    const errorRateTrend = this.calculateTrend(errorRates);
    const throughputTrend = this.calculateTrend(throughput);
    
    // Identify anomalies
    const responseTimeAnomalies = this.detectAnomalies(responseTimes);
    const errorRateAnomalies = this.detectAnomalies(errorRates);
    
    return {
      averageResponseTime: avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      averageErrorRate: avgErrorRate,
      averageThroughput: avgThroughput,
      responseTimeTrend,
      errorRateTrend,
      throughputTrend,
      responseTimeAnomalies,
      errorRateAnomalies,
      status: this.determineAPIStatus(avgResponseTime, avgErrorRate, responseTimeTrend, errorRateTrend)
    };
  }
  
  private async analyzeDatabasePerformance(metrics: DBMetrics[]): Promise<DatabasePerformanceAnalysis> {
    const queryTimes = metrics.map(m => m.avgQueryTime);
    const connectionCounts = metrics.map(m => m.activeConnections);
    const cacheHitRates = metrics.map(m => m.cacheHitRate);
    
    // Calculate statistics
    const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const avgConnections = connectionCounts.reduce((a, b) => a + b, 0) / connectionCounts.length;
    const avgCacheHitRate = cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length;
    
    // Identify slow queries
    const slowQueries = metrics
      .filter(m => m.avgQueryTime > 1000)
      .sort((a, b) => b.avgQueryTime - a.avgQueryTime)
      .slice(0, 10);
    
    // Identify connection issues
    const connectionIssues = metrics.filter(m => m.activeConnections > 150);
    
    // Identify cache issues
    const cacheIssues = metrics.filter(m => m.cacheHitRate < 0.8);
    
    return {
      averageQueryTime: avgQueryTime,
      averageConnections: avgConnections,
      averageCacheHitRate: avgCacheHitRate,
      slowQueries,
      connectionIssues,
      cacheIssues,
      status: this.determineDBStatus(avgQueryTime, avgConnections, avgCacheHitRate)
    };
  }
  
  private async analyzeAIPerformance(metrics: AIMetrics[]): Promise<AIPerformanceAnalysis> {
    const responseTimes = metrics.map(m => m.responseTime);
    const costs = metrics.map(m => m.cost);
    const cacheHitRates = metrics.map(m => m.cacheHitRate);
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const avgCacheHitRate = cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length;
    
    // Identify expensive requests
    const expensiveRequests = metrics
      .filter(m => m.cost > 0.01) // > $0.01 per request
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
    
    // Identify slow AI requests
    const slowRequests = metrics
      .filter(m => m.responseTime > 10000) // > 10 seconds
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10);
    
    // Calculate cost trends
    const costTrend = this.calculateTrend(costs);
    
    return {
      averageResponseTime: avgResponseTime,
      averageCost: avgCost,
      averageCacheHitRate: avgCacheHitRate,
      expensiveRequests,
      slowRequests,
      costTrend,
      status: this.determineAIStatus(avgResponseTime, avgCost, avgCacheHitRate)
    };
  }
  
  private determineAPIStatus(
    avgResponseTime: number,
    avgErrorRate: number,
    responseTimeTrend: number,
    errorRateTrend: number
  ): PerformanceStatus {
    if (avgResponseTime > 2000 || avgErrorRate > 0.05) {
      return 'critical';
    } else if (avgResponseTime > 1000 || avgErrorRate > 0.02) {
      return 'warning';
    } else if (responseTimeTrend > 0.1 || errorRateTrend > 0.05) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
  
  private determineDBStatus(
    avgQueryTime: number,
    avgConnections: number,
    avgCacheHitRate: number
  ): PerformanceStatus {
    if (avgQueryTime > 5000 || avgConnections > 180 || avgCacheHitRate < 0.7) {
      return 'critical';
    } else if (avgQueryTime > 2000 || avgConnections > 150 || avgCacheHitRate < 0.8) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  private determineAIStatus(
    avgResponseTime: number,
    avgCost: number,
    avgCacheHitRate: number
  ): PerformanceStatus {
    if (avgResponseTime > 15000 || avgCost > 0.1 || avgCacheHitRate < 0.3) {
      return 'critical';
    } else if (avgResponseTime > 8000 || avgCost > 0.05 || avgCacheHitRate < 0.5) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  private percentile(values: number[], p: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
  
  private detectAnomalies(values: number[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > 3) { // 3 standard deviations
        anomalies.push({
          index,
          value,
          zScore,
          type: 'statistical_outlier'
        });
      }
    });
    
    return anomalies;
  }
  
  private generatePerformanceRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.api.status === 'critical') {
      recommendations.push('API performance is critical - consider immediate scaling up');
      recommendations.push('Review recent deployments for performance regressions');
    }
    
    if (analysis.database.status === 'critical') {
      recommendations.push('Database performance is critical - check for slow queries');
      recommendations.push('Consider adding database indexes or optimizing queries');
      recommendations.push('Verify database connection pool configuration');
    }
    
    if (analysis.ai.status === 'critical') {
      recommendations.push('AI service performance is critical - check API rate limits');
      recommendations.push('Review AI caching strategy and increase hit rate');
      recommendations.push('Consider optimizing AI request batching');
    }
    
    if (analysis.memory.status === 'warning') {
      recommendations.push('Memory usage is high - check for memory leaks');
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }
    
    if (analysis.cpu.status === 'warning') {
      recommendations.push('CPU usage is high - check for infinite loops or inefficient code');
      recommendations.push('Consider scaling up or optimizing CPU-intensive operations');
    }
    
    return recommendations;
  }
}
```

---

## Database Diagnostics

### 1. Database Diagnostic Toolkit

```typescript
// src/diagnostics/database-diagnostic.ts
export class DatabaseDiagnostic {
  private db: PrismaClient;
  private connectionPool: ConnectionPool;
  
  constructor() {
    this.db = new PrismaClient();
    this.connectionPool = new ConnectionPool();
  }
  
  async runFullDiagnostic(): Promise<DatabaseDiagnosticReport> {
    console.log('Starting database diagnostic...');
    
    const startTime = Date.now();
    
    // Run all diagnostic checks
    const [
      connectionDiagnostic,
      performanceDiagnostic,
      indexDiagnostic,
      sizeDiagnostic,
      replicationDiagnostic,
      lockDiagnostic
    ] = await Promise.all([
      this.diagnoseConnections(),
      this.diagnosePerformance(),
      this.diagnoseIndexes(),
      this.diagnoseSize(),
      this.diagnoseReplication(),
      this.diagnoseLocks()
    ]);
    
    const duration = Date.now() - startTime;
    
    const report: DatabaseDiagnosticReport = {
      timestamp: new Date(),
      duration,
      overall: this.determineOverallStatus([
        connectionDiagnostic,
        performanceDiagnostic,
        indexDiagnostic,
        sizeDiagnostic,
        replicationDiagnostic,
        lockDiagnostic
      ]),
      connection: connectionDiagnostic,
      performance: performanceDiagnostic,
      indexes: indexDiagnostic,
      size: sizeDiagnostic,
      replication: replicationDiagnostic,
      locks: lockDiagnostic,
      recommendations: this.generateDatabaseRecommendations({
        connectionDiagnostic,
        performanceDiagnostic,
        indexDiagnostic,
        sizeDiagnostic,
        replicationDiagnostic,
        lockDiagnostic
      })
    };
    
    await this.saveDiagnosticReport(report);
    
    return report;
  }
  
  private async diagnoseConnections(): Promise<ConnectionDiagnostic> {
    try {
      const result = await this.db.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          max(now() - query_start) as longest_query_duration
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      const stats = result[0] as any;
      
      const utilizationRate = stats.total_connections > 0 ? 
        stats.active_connections / stats.total_connections : 0;
      
      const status = this.determineConnectionStatus(stats, utilizationRate);
      
      return {
        status,
        totalConnections: stats.total_connections,
        activeConnections: stats.active_connections,
        idleConnections: stats.idle_connections,
        waitingConnections: stats.waiting_connections,
        idleInTransaction: stats.idle_in_transaction,
        longestQueryDuration: stats.longest_query_duration,
        utilizationRate,
        recommendation: this.getConnectionRecommendation(status, stats, utilizationRate)
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to diagnose connections: ${error.message}`,
        error: error.message
      };
    }
  }
  
  private async diagnosePerformance(): Promise<PerformanceDiagnostic> {
    try {
      const [slowQueries, indexUsage, cacheStats] = await Promise.all([
        this.getSlowQueries(),
        this.getIndexUsage(),
        this.getCacheStats()
      ]);
      
      const status = this.determinePerformanceStatus(slowQueries, indexUsage, cacheStats);
      
      return {
        status,
        slowQueries: slowQueries.slice(0, 10),
        unusedIndexes: indexUsage.unused.slice(0, 10),
        cacheHitRate: cacheStats.hitRate,
        avgQueryTime: cacheStats.avgQueryTime,
        recommendation: this.getPerformanceRecommendation(status, slowQueries, indexUsage, cacheStats)
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to diagnose performance: ${error.message}`,
        error: error.message
      };
    }
  }
  
  private async diagnoseIndexes(): Promise<IndexDiagnostic> {
    try {
      const [missingIndexes, duplicateIndexes, inefficientIndexes] = await Promise.all([
        this.getMissingIndexes(),
        this.getDuplicateIndexes(),
        this.getInefficientIndexes()
      ]);
      
      const status = this.determineIndexStatus(missingIndexes, duplicateIndexes, inefficientIndexes);
      
      return {
        status,
        missingIndexes,
        duplicateIndexes,
        inefficientIndexes,
        totalIndexes: await this.getTotalIndexes(),
        recommendation: this.getIndexRecommendation(status, missingIndexes, duplicateIndexes, inefficientIndexes)
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to diagnose indexes: ${error.message}`,
        error: error.message
      };
    }
  }
  
  private async getSlowQueries(): Promise<SlowQuery[]> {
    const result = await this.db.$queryRaw`
      SELECT 
        query,
        calls,
        mean_exec_time,
        total_exec_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_percent
      FROM pg_stat_statements 
      WHERE mean_exec_time > 500 
      ORDER BY mean_exec_time DESC 
      LIMIT 20
    `;
    
    return result.map((row: any) => ({
      query: row.query,
      calls: row.calls,
      meanExecTime: row.mean_exec_time,
      totalExecTime: row.total_exec_time,
      rows: row.rows,
      hitPercent: row.hit_percent
    }));
  }
  
  private async getIndexUsage(): Promise<IndexUsage> {
    const [usedIndexes, allIndexes] = await Promise.all([
      this.getUsedIndexes(),
      this.getAllIndexes()
    ]);
    
    const usedIndexNames = new Set(usedIndexes.map(idx => idx.name));
    const unusedIndexes = allIndexes.filter(idx => !usedIndexNames.has(idx.name));
    
    return {
      used: usedIndexes,
      unused: unusedIndexes,
      total: allIndexes.length
    };
  }
  
  private async getCacheStats(): Promise<CacheStats> {
    const result = await this.db.$queryRaw`
      SELECT 
        sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) as cache_hit_rate,
        sum(blk_read_time) / nullif(sum(blk_read_time), 0) as avg_read_time
      FROM pg_stat_database 
      WHERE datname = current_database()
    `;
    
    const stats = result[0] as any;
    
    return {
      hitRate: stats.cache_hit_rate || 0,
      avgQueryTime: stats.avg_read_time || 0
    };
  }
  
  private determineConnectionStatus(stats: any, utilizationRate: number): DiagnosticStatus {
    if (stats.total_connections > 180 || utilizationRate > 0.9) {
      return 'critical';
    } else if (stats.total_connections > 150 || utilizationRate > 0.8) {
      return 'warning';
    } else if (stats.waiting_connections > 10 || stats.idle_in_transaction > 5) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
  
  private determinePerformanceStatus(
    slowQueries: SlowQuery[],
    indexUsage: IndexUsage,
    cacheStats: CacheStats
  ): DiagnosticStatus {
    const hasVerySlowQueries = slowQueries.some(q => q.meanExecTime > 5000);
    const hasLowCacheHitRate = cacheStats.hitRate < 0.8;
    const hasManyUnusedIndexes = indexUsage.unused.length > 10;
    
    if (hasVerySlowQueries || hasLowCacheHitRate) {
      return 'critical';
    } else if (slowQueries.length > 5 || hasManyUnusedIndexes) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  private getConnectionRecommendation(
    status: DiagnosticStatus,
    stats: any,
    utilizationRate: number
  ): string {
    switch (status) {
      case 'critical':
        return 'Connection pool is critically overloaded. Immediate action required: consider scaling up database or optimizing connection usage.';
      case 'warning':
        return 'Connection pool is under pressure. Monitor closely and consider optimizing connection handling.';
      case 'degraded':
        return 'Connection pool shows signs of stress. Review long-running queries and transaction management.';
      default:
        return 'Connection pool is operating normally.';
    }
  }
  
  private getPerformanceRecommendation(
    status: DiagnosticStatus,
    slowQueries: SlowQuery[],
    indexUsage: IndexUsage,
    cacheStats: CacheStats
  ): string {
    const recommendations: string[] = [];
    
    if (status === 'critical') {
      recommendations.push('Database performance is critical. Immediate action required.');
    }
    
    if (slowQueries.length > 0) {
      recommendations.push(`Found ${slowQueries.length} slow queries. Review and optimize query performance.`);
    }
    
    if (cacheStats.hitRate < 0.8) {
      recommendations.push(`Cache hit rate is ${(cacheStats.hitRate * 100).toFixed(2)}%. Consider improving cache effectiveness.`);
    }
    
    if (indexUsage.unused.length > 5) {
      recommendations.push(`Found ${indexUsage.unused.length} unused indexes. Consider removing to improve performance.`);
    }
    
    return recommendations.join(' ');
  }
}
```

---

## AI Service Diagnostics

### 1. AI Service Diagnostic Tools

```typescript
// src/diagnostics/ai-diagnostic.ts
export class AIDiagnostic {
  private aiService: AIService;
  private cacheService: AICacheService;
  private metrics: MetricsService;
  
  constructor() {
    this.aiService = getAIService();
    this.cacheService = new AICacheService();
    this.metrics = new MetricsService();
  }
  
  async runFullDiagnostic(): Promise<AIDiagnosticReport> {
    console.log('Starting AI service diagnostic...');
    
    const startTime = Date.now();
    
    // Run all diagnostic checks
    const [
      apiDiagnostic,
      cacheDiagnostic,
      costDiagnostic,
      performanceDiagnostic,
      rateLimitDiagnostic
    ] = await Promise.all([
      this.diagnoseAPI(),
      this.diagnoseCache(),
      this.diagnoseCost(),
      this.diagnosePerformance(),
      this.diagnoseRateLimits()
    ]);
    
    const duration = Date.now() - startTime;
    
    const report: AIDiagnosticReport = {
      timestamp: new Date(),
      duration,
      overall: this.determineOverallStatus([
        apiDiagnostic,
        cacheDiagnostic,
        costDiagnostic,
        performanceDiagnostic,
        rateLimitDiagnostic
      ]),
      api: apiDiagnostic,
      cache: cacheDiagnostic,
      cost: costDiagnostic,
      performance: performanceDiagnostic,
      rateLimits: rateLimitDiagnostic,
      recommendations: this.generateAIRecommendations({
        apiDiagnostic,
        cacheDiagnostic,
        costDiagnostic,
        performanceDiagnostic,
        rateLimitDiagnostic
      })
    };
    
    await this.saveDiagnosticReport(report);
    
    return report;
  }
  
  private async diagnoseAPI(): Promise<AIPIDiagnostic> {
    const testRequests = [
      { query: 'Test query', expectedTime: 2000 },
      { query: 'What is 2+2?', expectedTime: 1000 },
      { query: 'Summarize this: Hello world', expectedTime: 3000 }
    ];
    
    const results: APITestResult[] = [];
    
    for (const test of testRequests) {
      try {
        const startTime = Date.now();
        const response = await this.aiService.generateText({
          query: test.query,
          model: 'gemini-pro'
        });
        const duration = Date.now() - startTime;
        
        results.push({
          query: test.query,
          success: true,
          duration,
          expectedTime: test.expectedTime,
          withinExpectedTime: duration <= test.expectedTime,
          tokensUsed: response.tokensUsed,
          response: response.text.substring(0, 100) + '...'
        });
        
      } catch (error) {
        results.push({
          query: test.query,
          success: false,
          error: error.message,
          duration: 0,
          expectedTime: test.expectedTime
        });
      }
    }
    
    const successRate = results.filter(r => r.success).length / results.length;
    const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
    const withinExpectedRate = results.filter(r => r.success && r.withinExpectedTime).length / results.filter(r => r.success).length;
    
    const status = this.determineAPIStatus(successRate, avgDuration, withinExpectedRate);
    
    return {
      status,
      successRate,
      averageDuration: avgDuration,
      withinExpectedRate,
      results,
      recommendation: this.getAPIRecommendation(status, successRate, avgDuration)
    };
  }
  
  private async diagnoseCache(): Promise<AICacheDiagnostic> {
    const testQueries = [
      { query: 'What is AI?', type: 'general' },
      { query: 'Trend analysis example', type: 'trend' },
      { query: 'Prediction example', type: 'prediction' }
    ];
    
    const cacheResults: CacheTestResult[] = [];
    
    for (const test of testQueries) {
      const request: AIRequest = {
        query: test.query,
        model: 'gemini-pro'
      };
      
      // First call (cache miss)
      const missStart = Date.now();
      const missResponse = await this.aiService.generateText(request);
      const missDuration = Date.now() - missStart;
      
      // Second call (cache hit)
      const hitStart = Date.now();
      const hitResponse = await this.aiService.generateText(request);
      const hitDuration = Date.now() - hitStart;
      
      cacheResults.push({
        query: test.query,
        type: test.type,
        missDuration,
        hitDuration,
        cacheHit: hitResponse.isCached,
        speedup: missDuration / hitDuration,
        tokensSaved: hitResponse.isCached ? missResponse.tokensUsed : 0
      });
    }
    
    const avgSpeedup = cacheResults.reduce((sum, r) => sum + r.speedup, 0) / cacheResults.length;
    const cacheHitRate = cacheResults.filter(r => r.cacheHit).length / cacheResults.length;
    const totalTokensSaved = cacheResults.reduce((sum, r) => sum + r.tokensSaved, 0);
    
    const status = this.determineCacheStatus(avgSpeedup, cacheHitRate);
    
    return {
      status,
      cacheHitRate,
      averageSpeedup: avgSpeedup,
      totalTokensSaved,
      results,
      recommendation: this.getCacheRecommendation(status, cacheHitRate, avgSpeedup)
    };
  }
  
  private async diagnoseCost(): Promise<AICostDiagnostic> {
    const timeRange = '24 hours';
    
    // Get cost data from metrics
    const costData = await this.metrics.getCostData(timeRange);
    
    const totalCost = costData.reduce((sum, d) => sum + d.cost, 0);
    const totalTokens = costData.reduce((sum, d) => sum + d.tokensUsed, 0);
    const totalRequests = costData.length;
    
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
    
    // Cost breakdown by model
    const costByModel = costData.reduce((acc, d) => {
      acc[d.model] = (acc[d.model] || 0) + d.cost;
      return acc;
    }, {} as Record<string, number>);
    
    // Cost breakdown by query type
    const costByQueryType = costData.reduce((acc, d) => {
      acc[d.queryType] = (acc[d.queryType] || 0) + d.cost;
      return acc;
    }, {} as Record<string, number>);
    
    const status = this.determineCostStatus(totalCost, avgCostPerRequest);
    
    return {
      status,
      totalCost,
      averageCostPerRequest,
      averageCostPerToken,
      totalRequests,
      totalTokens,
      costByModel,
      costByQueryType,
      recommendation: this.getCostRecommendation(status, totalCost, avgCostPerRequest)
    };
  }
  
  private async diagnosePerformance(): Promise<AIPerformanceDiagnostic> {
    const recentMetrics = await this.metrics.getRecentMetrics('1 hour');
    
    const responseTimes = recentMetrics.map(m => m.responseTime);
    const errorRates = recentMetrics.map(m => m.errorRate);
    const throughput = recentMetrics.map(m => m.throughput);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = this.percentile(responseTimes, 95);
    const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
    const avgThroughput = throughput.reduce((a, b) => a + b, 0) / throughput.length;
    
    // Analyze trends
    const responseTimeTrend = this.calculateTrend(responseTimes);
    const errorRateTrend = this.calculateTrend(errorRates);
    const throughputTrend = this.calculateTrend(throughput);
    
    const status = this.determinePerformanceStatus(avgResponseTime, avgErrorRate, responseTimeTrend, errorRateTrend);
    
    return {
      status,
      averageResponseTime: avgResponseTime,
      p95ResponseTime,
      averageErrorRate: avgErrorRate,
      averageThroughput: avgThroughput,
      responseTimeTrend,
      errorRateTrend,
      throughputTrend,
      recommendation: this.getPerformanceRecommendation(status, avgResponseTime, avgErrorRate)
    };
  }
  
  private async diagnoseRateLimits(): Promise<AIRateLimitDiagnostic> {
    const rateLimitData = await this.metrics.getRateLimitData('1 hour');
    
    const totalRequests = rateLimitData.reduce((sum, d) => sum + d.totalRequests, 0);
    const rateLimitedRequests = rateLimitData.reduce((sum, d) => sum + d.rateLimitedRequests, 0);
    const rateLimitRate = totalRequests > 0 ? rateLimitedRequests / totalRequests : 0;
    
    // Analyze by API key
    const rateLimitsByKey = rateLimitData.reduce((acc, d) => {
      acc[d.apiKey] = (acc[d.apiKey] || 0) + d.rateLimitedRequests;
      return acc;
    }, {} as Record<string, number>);
    
    const status = this.determineRateLimitStatus(rateLimitRate);
    
    return {
      status,
      totalRequests,
      rateLimitedRequests,
      rateLimitRate,
      rateLimitsByKey,
      recommendation: this.getRateLimitRecommendation(status, rateLimitRate)
    };
  }
  
  private determineAPIStatus(
    successRate: number,
    avgDuration: number,
    withinExpectedRate: number
  ): DiagnosticStatus {
    if (successRate < 0.9) {
      return 'critical';
    } else if (successRate < 0.95 || avgDuration > 5000) {
      return 'warning';
    } else if (withinExpectedRate < 0.8) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
  
  private determineCacheStatus(avgSpeedup: number, cacheHitRate: number): DiagnosticStatus {
    if (cacheHitRate < 0.3) {
      return 'critical';
    } else if (cacheHitRate < 0.5 || avgSpeedup < 2) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  private determineCostStatus(totalCost: number, avgCostPerRequest: number): DiagnosticStatus {
    // Assume daily budget of $100
    const dailyBudget = 100;
    const projectedDailyCost = totalCost * 24; // If data is for 1 hour
    
    if (projectedDailyCost > dailyBudget * 1.5) {
      return 'critical';
    } else if (projectedDailyCost > dailyBudget || avgCostPerRequest > 0.1) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  private generateAIRecommendations(diagnostics: any): string[] {
    const recommendations: string[] = [];
    
    if (diagnostics.api.status === 'critical') {
      recommendations.push('AI API is experiencing critical issues - check API keys and service status');
    }
    
    if (diagnostics.cache.status === 'warning') {
      recommendations.push('AI cache performance is suboptimal - consider adjusting cache TTL and warming strategies');
    }
    
    if (diagnostics.cost.status === 'warning') {
      recommendations.push('AI costs are higher than expected - review query optimization and caching');
    }
    
    if (diagnostics.performance.status === 'warning') {
      recommendations.push('AI service performance is degraded - check for bottlenecks and optimize request batching');
    }
    
    if (diagnostics.rateLimits.status === 'warning') {
      recommendations.push('Rate limiting is affecting service - consider API key rotation or request optimization');
    }
    
    return recommendations;
  }
}
```

---

## Common Issues & Solutions

### 1. Performance Issues

#### High Response Times
**Symptoms:**
- API responses > 2 seconds
- Database queries > 1 second
- AI requests > 10 seconds

**Diagnostic Steps:**
```bash
# Check API response times
curl -w "@{time_total}\n" -o /dev/null -s https://api.votelens.app/health

# Check database slow queries
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Check AI service performance
curl -X POST https://api.votelens.app/ai/test \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "model": "gemini-pro"}'
```

**Solutions:**
1. **Database Optimization:**
   - Add missing indexes
   - Optimize slow queries
   - Increase connection pool size
   - Enable query caching

2. **API Optimization:**
   - Implement response caching
   - Optimize serialization
   - Add request batching
   - Enable compression

3. **AI Service Optimization:**
   - Implement AI response caching
   - Use request batching
   - Optimize prompt engineering
   - Add rate limiting with backoff

#### Memory Leaks
**Symptoms:**
- Memory usage continuously increasing
- Out-of-memory errors
- Frequent garbage collection

**Diagnostic Steps:**
```bash
# Monitor memory usage
node --inspect src/app/server.js

# Check memory trends
curl https://api.votelens.app/health/memory

# Analyze heap dumps
node --heap-prof src/app/server.js
```

**Solutions:**
1. **Code Optimization:**
   - Fix memory leaks in event handlers
   - Properly close database connections
   - Clear unused cache entries
   - Use weak references for large objects

2. **Configuration:**
   - Increase memory allocation
   - Optimize garbage collection settings
   - Implement memory limits
   - Add memory monitoring alerts

#### Database Connection Issues
**Symptoms:**
- Connection timeout errors
- Too many connections
- Connection pool exhaustion

**Diagnostic Steps:**
```bash
# Check connection count
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "
SELECT count(*) as connections, 
       count(*) FILTER (WHERE state = 'active') as active,
       count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;"

# Check connection pool settings
curl https://api.votelens.app/health/db

# Monitor connection trends
curl https://api.votelens.app/metrics/connections
```

**Solutions:**
1. **Connection Pool:**
   - Increase max connections
   - Optimize connection timeout
   - Implement connection retry logic
   - Add connection monitoring

2. **Database Configuration:**
   - Tune PostgreSQL settings
   - Optimize connection pool parameters
   - Enable connection pooling
   - Add connection monitoring

### 2. Availability Issues

#### Service Downtime
**Symptoms:**
- Service not responding
- Health checks failing
- Error responses

**Diagnostic Steps:**
```bash
# Check service status
railway status

# Check service logs
railway logs votelens-backend

# Check health endpoints
curl -f https://api.votelens.app/health || echo "Health check failed"

# Check Railway status
curl https://status.railway.app
```

**Solutions:**
1. **Immediate Recovery:**
   - Restart service: `railway restart`
   - Check recent deployments
   - Rollback if necessary
   - Verify configuration

2. **Prevention:**
   - Implement health checks
   - Add monitoring alerts
   - Use blue-green deployment
   - Implement circuit breakers

#### Database Unavailability
**Symptoms:**
- Database connection errors
- Query timeouts
- Replication lag

**Diagnostic Steps:**
```bash
# Check database connectivity
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;"

# Check replication status
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "
SELECT * FROM pg_stat_replication;"

# Check database logs
railway logs votelens-postgresql
```

**Solutions:**
1. **Connection Issues:**
   - Verify database credentials
   - Check network connectivity
   - Update connection strings
   - Implement connection retry

2. **Replication Issues:**
   - Check replication lag
   - Restart replication
   - Verify replica configuration
   - Monitor replica health

### 3. AI Service Issues

#### API Rate Limiting
**Symptoms:**
- 429 Too Many Requests errors
- Request throttling
- Service degradation

**Diagnostic Steps:**
```bash
# Check rate limit headers
curl -I https://api.votelens.app/ai/test

# Monitor rate limit metrics
curl https://api.votelens.app/metrics/ai-rate-limits

# Check API key usage
curl -H "Authorization: Bearer $API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

**Solutions:**
1. **Rate Limit Handling:**
   - Implement exponential backoff
   - Use multiple API keys
   - Add request queuing
   - Optimize request frequency

2. **API Key Management:**
   - Rotate API keys regularly
   - Distribute load across keys
   - Monitor key usage
   - Implement key pooling

#### AI Response Quality
**Symptoms:**
- Poor quality responses
- Irrelevant answers
- Inconsistent results

**Diagnostic Steps:**
```bash
# Test AI service quality
curl -X POST https://api.votelens.app/ai/test \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "expected_type": "factual"}'

# Monitor response quality metrics
curl https://api.votelens.app/metrics/ai-quality

# Check cache effectiveness
curl https://api.votelens.app/metrics/ai-cache
```

**Solutions:**
1. **Prompt Optimization:**
   - Improve prompt engineering
   - Add context to queries
   - Use consistent formatting
   - Implement prompt templates

2. **Quality Control:**
   - Add response validation
   - Implement quality scoring
   - Monitor response relevance
   - Add feedback mechanisms

---

## Emergency Procedures

### 1. Service Outage Response

```bash
#!/bin/bash
# emergency-response.sh

echo "🚨 EMERGENCY RESPONSE ACTIVATED 🚨"

# 1. Assess current status
echo "Assessing service status..."
railway status
curl -s https://api.votelens.app/health || echo "API DOWN"
curl -s https://api.votelens.app/health/db || echo "DB DOWN"

# 2. Check recent changes
echo "Checking recent deployments..."
railway logs votelens-backend --tail 50

# 3. Immediate recovery actions
echo "Attempting immediate recovery..."

# Restart services
railway restart

# Scale up if needed
railway up --count 5

# 4. Notify team
echo "Notifying on-call team..."
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 VoteLens AI Emergency - Service Outage Detected"}'

# 5. Monitor recovery
echo "Monitoring recovery..."
for i in {1..10}; do
  sleep 30
  if curl -f https://api.votelens.app/health; then
    echo "✅ Service recovered after $((i * 30)) seconds"
    break
  fi
  echo "⏳ Still checking... ($i/10)"
done

echo "Emergency response completed"
```

### 2. Database Emergency Procedures

```bash
#!/bin/bash
# database-emergency.sh

echo "🚨 DATABASE EMERGENCY RESPONSE ACTIVATED 🚨"

# 1. Check database status
echo "Checking database status..."
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "
SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database();"

# 2. Kill long-running queries
echo "Killing long-running queries..."
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND now() - query_start > interval '5 minutes'
  AND pid != pg_backend_pid();"

# 3. Restart database service
echo "Restarting database service..."
railway restart votelens-postgresql

# 4. Check disk space
echo "Checking disk space..."
df -h

# 5. Notify team
echo "Notifying database team..."
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 Database Emergency Response Activated"}'

echo "Database emergency response completed"
```

### 3. Security Incident Response

```bash
#!/bin/bash
# security-incident.sh

echo "🚨 SECURITY INCIDENT RESPONSE ACTIVATED 🚨"

# 1. Lock down services
echo "Locking down services..."
railway variables set MAINTENANCE_MODE=true

# 2. Enable enhanced logging
echo "Enabling enhanced logging..."
railway variables set LOG_LEVEL=debug

# 3. Check for unauthorized access
echo "Checking for unauthorized access..."
railway logs votelens-backend --tail 100 | grep -i "unauthorized\|forbidden\|401\|403"

# 4. Rotate secrets
echo "Rotating secrets..."
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set DATABASE_PASSWORD=$(openssl rand -base64 32)

# 5. Enable rate limiting
echo "Enabling strict rate limiting..."
railway variables set RATE_LIMIT_STRICT=true

# 6. Notify security team
echo "Notifying security team..."
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 Security Incident Response Activated - Immediate attention required"}'

echo "Security incident response completed"
```

---

## Implementation Checklist

### Phase 1: Diagnostic Tools Setup (Week 1)
- [ ] Implement health check endpoints
- [ ] Set up diagnostic scripts
- [ ] Configure monitoring dashboards
- [ ] Create automated health checks
- [ ] Set up alert notifications

### Phase 2: Performance Diagnostics (Week 2)
- [ ] Implement performance analysis tools
- [ ] Set up database diagnostic queries
- [ ] Configure AI service diagnostics
- [ ] Create performance baselines
- [ ] Set up trend analysis

### Phase 3: Troubleshooting Guides (Week 3)
- [ ] Document common issues and solutions
- [ ] Create emergency response procedures
- [ ] Set up runbooks for common problems
- [ ] Create escalation procedures
- [ ] Train team on diagnostic tools

### Phase 4: Automation & Monitoring (Week 4)
- [ ] Implement automated diagnostics
- [ ] Set up continuous monitoring
- [ ] Create diagnostic reports
- [ ] Implement predictive alerts
- [ ] Set up integration with incident management

---

## Conclusion

This comprehensive diagnostic guide provides VoteLens AI with the tools and procedures needed to quickly identify, analyze, and resolve production issues. The combination of automated diagnostics, real-time monitoring, and detailed troubleshooting procedures ensures rapid incident response and system recovery.

Regular practice of diagnostic procedures and continuous improvement of troubleshooting guides will ensure the team can effectively handle any production issues that may arise.
