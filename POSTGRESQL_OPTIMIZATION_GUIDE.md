# VoteLens AI - PostgreSQL Optimization Guide

## Executive Summary

This guide provides comprehensive PostgreSQL optimization strategies for VoteLens AI, covering connection pooling, query optimization, indexing strategies, and performance monitoring for Railway production deployment.

---

## Table of Contents

1. [Connection Pooling Configuration](#connection-pooling-configuration)
2. [Query Optimization Strategies](#query-optimization-strategies)
3. [Indexing Strategy](#indexing-strategy)
4. [Database Configuration](#database-configuration)
5. [Performance Monitoring](#performance-monitoring)
6. [Maintenance Operations](#maintenance-operations)
7. [Scaling Strategies](#scaling-strategies)

---

## Connection Pooling Configuration

### 1. PgBouncer Setup

#### Installation and Configuration
```bash
# Install PgBouncer
sudo apt-get update
sudo apt-get install -y pgbouncer

# Configure PgBouncer
sudo nano /etc/pgbouncer/pgbouncer.ini
```

#### PgBouncer Configuration
```ini
[databases]
votelens = host=postgresql.railway.app port=5432 dbname=votelens
votelens_replica = host=replica.railway.app port=5432 dbname=votelens

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = plain
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = postgres, votelens
stats_users = stats, votelens

# Pool settings
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 50

# Timeouts
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600
client_idle_timeout = 300

# Advanced settings
ignore_startup_parameters = extra_float_digits
track_extra_parameters = search_path
pkt_buf = 4096
max_packet_size = 2147483647
```

#### User Authentication
```bash
# Create userlist.txt
sudo nano /etc/pgbouncer/userlist.txt

# Content:
"votelens" "your_password_hash"
"postgres" "your_postgres_password_hash"
```

#### Service Configuration
```bash
# Enable and start PgBouncer
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer

# Check status
sudo systemctl status pgbouncer
sudo pgbouncer -d /etc/pgbouncer/pgbouncer.ini
```

### 2. Prisma Connection Pooling

#### Enhanced Prisma Configuration
```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private static instance: PrismaClient;
  
  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
        
        // Connection pooling settings
        __internal: {
          engine: {
            connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '25'),
            poolTimeout: 30000,
            idleTimeout: 10000,
            maxLifetime: 3600000, // 1 hour
            connectTimeout: 10000,
            acquireTimeout: 60000,
            reapIntervalMillis: 1000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            createRetryIntervalMillis: 200,
            propagateCreateError: false
          }
        }
      });
    }
    return this.instance;
  }
  
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null as any;
    }
  }
}
```

#### Connection Pool Monitoring
```typescript
// src/services/connection-pool.service.ts
export class ConnectionPoolService {
  private prisma: PrismaClient;
  private metrics: MetricsService;
  
  constructor() {
    this.prisma = DatabaseService.getInstance();
    this.metrics = new MetricsService();
  }
  
  async getPoolStats(): Promise<PoolStats> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      return {
        activeConnections: result[0]?.active_connections || 0,
        activeQueries: result[0]?.active_queries || 0,
        idleConnections: result[0]?.idle_connections || 0,
        idleInTransaction: result[0]?.idle_in_transaction || 0,
        timestamp: new Date()
      };
    } catch (error) {
      this.metrics.recordError('pool_stats_error', error);
      throw error;
    }
  }
}
```

---

## Query Optimization Strategies

### 1. Query Pattern Analysis

#### Slow Query Detection
```typescript
// src/services/query-optimizer.service.ts
export class QueryOptimizerService {
  private slowQueries: Map<string, QueryStats> = new Map();
  private threshold: number = 1000; // 1 second
  
  async trackQuery(query: string, duration: number, params?: any): Promise<void> {
    const queryHash = this.hashQuery(query);
    const stats = this.slowQueries.get(queryHash) || {
      query,
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      params: []
    };
    
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.lastSeen = new Date();
    
    if (params) {
      stats.params.push(params);
      if (stats.params.length > 10) {
        stats.params = stats.params.slice(-10);
      }
    }
    
    this.slowQueries.set(queryHash, stats);
    
    if (duration > this.threshold) {
      this.logSlowQuery(stats, duration);
    }
  }
  
  private logSlowQuery(stats: QueryStats, duration: number): void {
    console.warn(`Slow query detected (${duration}ms):`, {
      query: stats.query,
      avgDuration: stats.avgDuration,
      count: stats.count,
      maxDuration: stats.maxDuration
    });
    
    // Send to monitoring service
    this.metrics.recordSlowQuery(stats, duration);
  }
  
  getOptimizationSuggestions(): QueryOptimization[] {
    const suggestions: QueryOptimization[] = [];
    
    this.slowQueries.forEach((stats, hash) => {
      if (stats.avgDuration > 500) {
        suggestions.push({
          type: 'slow_query',
          query: stats.query,
          avgDuration: stats.avgDuration,
          count: stats.count,
          suggestions: this.generateQuerySuggestions(stats)
        });
      }
    });
    
    return suggestions;
  }
  
  private generateQuerySuggestions(stats: QueryStats): string[] {
    const suggestions: string[] = [];
    const query = stats.query.toLowerCase();
    
    // Check for missing indexes
    if (query.includes('where') && !query.includes('index')) {
      suggestions.push('Consider adding indexes for WHERE clause columns');
    }
    
    // Check for N+1 queries
    if (stats.count > 100 && stats.avgDuration > 200) {
      suggestions.push('Potential N+1 query problem. Consider using eager loading.');
    }
    
    // Check for full table scans
    if (query.includes('select *') && stats.avgDuration > 1000) {
      suggestions.push('Avoid SELECT *. Specify only required columns.');
    }
    
    // Check for missing LIMIT
    if (!query.includes('limit') && stats.avgDuration > 500) {
      suggestions.push('Consider adding LIMIT clause to prevent large result sets.');
    }
    
    return suggestions;
  }
}
```

### 2. Query Optimization Patterns

#### Efficient Pagination
```typescript
// Cursor-based pagination for large datasets
export class CursorPaginationService {
  async getElections(
    cursor?: string,
    limit: number = 50,
    filters?: ElectionFilters
  ): Promise<PaginatedResult<Election>> {
    const where = this.buildWhereClause(filters);
    
    // Add cursor condition
    if (cursor) {
      where.id = { gt: cursor };
    }
    
    const [elections, totalCount] = await Promise.all([
      this.prisma.election.findMany({
        where,
        orderBy: { id: 'asc' },
        take: limit + 1, // Get one extra to check if there are more
        select: {
          id: true,
          name: true,
          date: true,
          status: true,
          country: true,
          _count: {
            select: {
              constituencies: true,
              results: true
            }
          }
        }
      }),
      this.prisma.election.count({ where })
    ]);
    
    const hasMore = elections.length > limit;
    if (hasMore) {
      elections.pop(); // Remove the extra item
    }
    
    return {
      data: elections,
      hasMore,
      totalCount,
      nextCursor: hasMore ? elections[elections.length - 1].id : null
    };
  }
}
```

#### Optimized Aggregations
```typescript
// Pre-computed aggregations for analytics
export class AnalyticsOptimizationService {
  async getElectionAnalytics(electionId: string): Promise<ElectionAnalytics> {
    // Try to get from cache first
    const cacheKey = `analytics:${electionId}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Use materialized views for complex aggregations
    const analytics = await this.prisma.$queryRaw`
      SELECT 
        e.id as election_id,
        e.name as election_name,
        COUNT(DISTINCT c.id) as total_constituencies,
        COUNT(DISTINCT r.candidate_id) as total_candidates,
        SUM(r.votes) as total_votes_cast,
        AVG(r.percentage) as avg_vote_percentage,
        MAX(r.percentage) as max_vote_percentage,
        MIN(r.percentage) as min_vote_percentage,
        COUNT(DISTINCT CASE WHEN r.is_winner = true THEN r.candidate_id END) as total_winners
      FROM elections e
      LEFT JOIN constituencies c ON e.id = c.election_id
      LEFT JOIN results r ON c.id = r.constituency_id
      WHERE e.id = ${electionId}
      GROUP BY e.id, e.name
    `;
    
    const result = this.formatAnalytics(analytics[0]);
    
    // Cache for 15 minutes
    await this.cache.set(cacheKey, result, 900);
    
    return result;
  }
}
```

---

## Indexing Strategy

### 1. Critical Indexes

#### Primary Indexes
```sql
-- User table indexes
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email, is_active);
CREATE INDEX CONCURRENTLY idx_users_role_created ON users(role, created_at);
CREATE INDEX CONCURRENTLY idx_users_organization ON users(organization_id) WHERE organization_id IS NOT NULL;

-- Election table indexes
CREATE INDEX CONCURRENTLY idx_elections_status_date ON elections(status, date DESC);
CREATE INDEX CONCURRENTLY idx_elections_country_status ON elections(country, status);
CREATE INDEX CONCURRENTLY idx_elections_date_range ON elections(date) WHERE date >= NOW() - INTERVAL '2 years';

-- Constituency indexes
CREATE INDEX CONCURRENTLY idx_constituencies_election_type ON constituencies(election_id, type);
CREATE INDEX CONCURRENTLY idx_constituencies_state_code ON constituencies(state, code);
CREATE INDEX CONCURRENTLY idx_constituencies_voter_count ON constituencies(total_voters DESC) WHERE total_voters IS NOT NULL;

-- Result table indexes (critical for performance)
CREATE INDEX CONCURRENTLY idx_results_election_candidate ON results(election_id, candidate_id);
CREATE INDEX CONCURRENTLY idx_results_constituency_votes ON results(constituency_id, votes DESC);
CREATE INDEX CONCURRENTLY idx_results_winner ON results(election_id, is_winner) WHERE is_winner = true;

-- Audit log indexes (for time-series queries)
CREATE INDEX CONCURRENTLY idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_action_time ON audit_logs(action, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_election_time ON audit_logs(election_id, created_at DESC) WHERE election_id IS NOT NULL;
```

#### Composite Indexes for Complex Queries
```sql
-- For election analytics
CREATE INDEX CONCURRENTLY idx_elections_analytics ON elections(status, country, date DESC);
CREATE INDEX CONCURRENTLY idx_results_analytics ON results(election_id, constituency_id, votes DESC);

-- For user activity tracking
CREATE INDEX CONCURRENTLY idx_query_history_user_time ON query_history(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_api_keys_user_expires ON api_keys(user_id, expires_at) WHERE expires_at IS NOT NULL;

-- For dataset management
CREATE INDEX CONCURRENTLY idx_datasets_election_status ON datasets(election_id, status, uploaded_at DESC);
CREATE INDEX CONCURRENTLY idx_datasets_type_size ON datasets(type, size DESC);
```

### 2. Partial Indexes

#### Conditional Indexes
```sql
-- Active elections only
CREATE INDEX CONCURRENTLY idx_active_elections ON elections(id, date) 
WHERE status IN ('READY', 'PROCESSING');

-- Recent audit logs
CREATE INDEX CONCURRENTLY idx_recent_audit_logs ON audit_logs(user_id, created_at) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Large datasets
CREATE INDEX CONCURRENTLY idx_large_datasets ON datasets(election_id, size) 
WHERE size > 1000000; -- > 1MB

-- Failed uploads
CREATE INDEX CONCURRENTLY idx_failed_uploads ON datasets(election_id, error, uploaded_at) 
WHERE status = 'FAILED';
```

### 3. Index Maintenance

#### Index Usage Analysis
```sql
-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

#### Index Optimization
```typescript
// src/services/index-optimization.service.ts
export class IndexOptimizationService {
  async analyzeIndexUsage(): Promise<IndexAnalysisReport> {
    const unusedIndexes = await this.getUnusedIndexes();
    const underusedIndexes = await this.getUnderusedIndexes();
    const missingIndexes = await this.getMissingIndexes();
    
    return {
      unusedIndexes,
      underusedIndexes,
      missingIndexes,
      recommendations: this.generateIndexRecommendations(unusedIndexes, underusedIndexes, missingIndexes)
    };
  }
  
  private async getUnusedIndexes(): Promise<UnusedIndex[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_stat_user_indexes 
      WHERE idx_scan = 0 
      AND schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexname::regclass) DESC
    `;
    
    return result as UnusedIndex[];
  }
  
  private async getMissingIndexes(): Promise<MissingIndex[]> {
    // Analyze slow queries for missing index opportunities
    const slowQueries = await this.getSlowQueries();
    const missingIndexes: MissingIndex[] = [];
    
    for (const query of slowQueries) {
      const analysis = this.analyzeQueryForIndexes(query.query);
      if (analysis.suggestedIndexes.length > 0) {
        missingIndexes.push({
          query: query.query,
          avgDuration: query.avgDuration,
          suggestedIndexes: analysis.suggestedIndexes,
          estimatedImprovement: analysis.estimatedImprovement
        });
      }
    }
    
    return missingIndexes;
  }
}
```

---

## Database Configuration

### 1. PostgreSQL Configuration

#### Memory Configuration
```sql
-- Memory settings for Railway Pro plan (2GB RAM)
ALTER SYSTEM SET shared_buffers = '512MB';           -- 25% of RAM
ALTER SYSTEM SET effective_cache_size = '1.5GB';       -- 75% of RAM
ALTER SYSTEM SET work_mem = '8MB';                    -- Per query
ALTER SYSTEM SET maintenance_work_mem = '128MB';       -- For maintenance
ALTER SYSTEM SET effective_io_concurrency = 200;       -- For SSD

-- Connection settings
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET superuser_reserved_connections = '3';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain';

-- Query planning
ALTER SYSTEM SET random_page_cost = '1.1';             -- SSD optimized
ALTER SYSTEM SET effective_io_concurrency = '200';     -- SSD concurrent I/O
ALTER SYSTEM SET seq_page_cost = '1.0';
ALTER SYSTEM SET cpu_tuple_cost = '0.01';
ALTER SYSTEM SET cpu_index_tuple_cost = '0.005';
ALTER SYSTEM SET cpu_operator_cost = '0.0025';

-- WAL settings
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_compression = 'on';
ALTER SYSTEM SET wal_writer_delay = '200ms';

-- Autovacuum tuning
ALTER SYSTEM SET autovacuum = 'on';
ALTER SYSTEM SET autovacuum_max_workers = '3';
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.1';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.05';
```

#### Query Performance Settings
```sql
-- Enable query statistics
ALTER SYSTEM SET track_activities = 'on';
ALTER SYSTEM SET track_counts = 'on';
ALTER SYSTEM SET track_io_timing = 'on';
ALTER SYSTEM SET track_functions = 'pl';

-- Statement logging
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = '10000';
ALTER SYSTEM SET pg_stat_statements.track_utility = 'off';

-- Auto-explain for slow queries
ALTER SYSTEM SET auto_explain.log_min_duration = '1000';  -- Log queries > 1s
ALTER SYSTEM SET auto_explain.log_analyze = 'on';
ALTER SYSTEM SET auto_explain.log_buffers = 'on';
ALTER SYSTEM SET auto_explain.log_timing = 'on';
ALTER SYSTEM SET auto_explain.log_triggers = 'on';
ALTER SYSTEM SET auto_explain.log_verbose = 'on';
ALTER SYSTEM SET auto_explain.log_format = 'json';

-- Apply changes
SELECT pg_reload_conf();
```

### 2. Connection Management

#### Connection Limits
```sql
-- Set role-based connection limits
ALTER ROLE votelens_app CONNECTION LIMIT 50;
ALTER ROLE votelens_readonly CONNECTION LIMIT 30;
ALTER ROLE votelens_admin CONNECTION LIMIT 10;

-- Monitor connection usage
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database 
WHERE datname = current_database();
```

#### Connection Pool Monitoring
```typescript
// src/services/connection-monitor.service.ts
export class ConnectionMonitorService {
  private metrics: MetricsService;
  
  async monitorConnections(): Promise<ConnectionMetrics> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting_connections,
        max(now() - query_start) as longest_query_duration,
        avg(now() - query_start) as avg_query_duration
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    const metrics = result[0] as any;
    
    // Record metrics
    this.metrics.recordGauge('db_connections_total', metrics.total_connections);
    this.metrics.recordGauge('db_connections_active', metrics.active_connections);
    this.metrics.recordGauge('db_connections_idle', metrics.idle_connections);
    
    // Alert if too many connections
    if (metrics.total_connections > 180) { // 90% of max
      this.alertManager.sendAlert({
        type: 'high_connection_count',
        value: metrics.total_connections,
        threshold: 180
      });
    }
    
    return metrics;
  }
}
```

---

## Performance Monitoring

### 1. Query Performance Tracking

#### pg_stat_statements Analysis
```sql
-- Top slowest queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 20;

-- Most frequently executed queries
SELECT 
    substring(query, 1, 100) as query_preview,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 20;

-- Queries with highest total execution time
SELECT 
    substring(query, 1, 100) as query_preview,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 20;
```

#### Real-time Query Monitoring
```typescript
// src/services/query-monitor.service.ts
export class QueryMonitorService {
  private slowQueryThreshold: number = 1000; // 1 second
  
  async monitorQueries(): Promise<void> {
    const longRunningQueries = await this.getLongRunningQueries();
    
    for (const query of longRunningQueries) {
      if (query.duration > this.slowQueryThreshold) {
        await this.handleSlowQuery(query);
      }
    }
  }
  
  private async getLongRunningQueries(): Promise<RunningQuery[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        pid,
        now() - query_start as duration,
        query,
        state,
        wait_event_type,
        wait_event,
        usename,
        application_name
      FROM pg_stat_activity 
      WHERE state = 'active' 
      AND query != '<IDLE>'
      AND now() - query_start > interval '100 milliseconds'
      ORDER BY duration DESC
    `;
    
    return result as RunningQuery[];
  }
  
  private async handleSlowQuery(query: RunningQuery): Promise<void> {
    // Log the slow query
    console.warn('Long running query detected:', {
      pid: query.pid,
      duration: query.duration,
      query: query.query,
      user: query.usename,
      application: query.application_name
    });
    
    // Record metrics
    this.metrics.recordHistogram('db_query_duration_seconds', query.duration / 1000, {
      state: query.state,
      wait_event_type: query.wait_event_type
    });
    
    // Consider killing very long queries
    if (query.duration > 300000) { // 5 minutes
      await this.killQuery(query.pid);
    }
  }
  
  private async killQuery(pid: number): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT pg_terminate_backend(${pid})`;
      console.info(`Terminated long-running query with PID: ${pid}`);
    } catch (error) {
      console.error(`Failed to terminate query ${pid}:`, error);
    }
  }
}
```

### 2. Database Health Monitoring

#### Health Check Service
```typescript
// src/services/database-health.service.ts
export class DatabaseHealthService {
  async getHealthStatus(): Promise<DatabaseHealth> {
    const [
      connectionStats,
      replicationStats,
      sizeStats,
      performanceStats
    ] = await Promise.all([
      this.getConnectionStats(),
      this.getReplicationStats(),
      this.getSizeStats(),
      this.getPerformanceStats()
    ]);
    
    const health: DatabaseHealth = {
      status: 'healthy',
      connections: connectionStats,
      replication: replicationStats,
      storage: sizeStats,
      performance: performanceStats,
      timestamp: new Date()
    };
    
    // Determine overall health
    if (connectionStats.totalConnections > 180) {
      health.status = 'degraded';
    }
    
    if (performanceStats.avgQueryTime > 2000) {
      health.status = 'degraded';
    }
    
    if (sizeStats.diskUsage > 0.9) {
      health.status = 'critical';
    }
    
    return health;
  }
  
  private async getConnectionStats(): Promise<ConnectionStats> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    return result[0] as ConnectionStats;
  }
  
  private async getPerformanceStats(): Promise<PerformanceStats> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        avg(mean_exec_time) as avg_query_time,
        max(mean_exec_time) as max_query_time,
        sum(calls) as total_calls,
        sum(total_exec_time) as total_exec_time
      FROM pg_stat_statements
    `;
    
    return result[0] as PerformanceStats;
  }
}
```

---

## Maintenance Operations

### 1. Automated Maintenance

#### Vacuum and Analyze
```typescript
// src/services/maintenance.service.ts
export class DatabaseMaintenanceService {
  async performMaintenance(): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      startTime: new Date(),
      operations: [],
      endTime: null,
      success: false
    };
    
    try {
      // 1. Update table statistics
      await this.analyzeTables();
      report.operations.push({ type: 'analyze', success: true });
      
      // 2. Vacuum bloated tables
      await this.vacuumTables();
      report.operations.push({ type: 'vacuum', success: true });
      
      // 3. Reindex fragmented indexes
      await this.reindexFragmentedIndexes();
      report.operations.push({ type: 'reindex', success: true });
      
      // 4. Clean up old data
      await this.cleanupOldData();
      report.operations.push({ type: 'cleanup', success: true });
      
      report.success = true;
      
    } catch (error) {
      console.error('Maintenance failed:', error);
      report.success = false;
    } finally {
      report.endTime = new Date();
    }
    
    return report;
  }
  
  private async analyzeTables(): Promise<void> {
    const tables = await this.getTablesToAnalyze();
    
    for (const table of tables) {
      try {
        await this.prisma.$executeRaw`ANALYZE ${table}`;
        console.log(`Analyzed table: ${table}`);
      } catch (error) {
        console.error(`Failed to analyze ${table}:`, error);
      }
    }
  }
  
  private async vacuumTables(): Promise<void> {
    const bloatedTables = await this.getBloatedTables();
    
    for (const table of bloatedTables) {
      try {
        await this.prisma.$executeRaw`VACUUM ANALYZE ${table.name}`;
        console.log(`Vacuumed table: ${table.name} (bloat: ${table.bloatPercentage}%)`);
      } catch (error) {
        console.error(`Failed to vacuum ${table.name}:`, error);
      }
    }
  }
  
  private async getBloatedTables(): Promise<BloatedTable[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_stat_get_tuples_inserted(c.oid) as inserts,
        pg_stat_get_tuples_updated(c.oid) as updates,
        pg_stat_get_tuples_deleted(c.oid) as deletes,
        CASE 
          WHEN pg_stat_get_tuples_inserted(c.oid) + pg_stat_get_tuples_updated(c.oid) + pg_stat_get_tuples_deleted(c.oid) > 0
          THEN round(100 * (pg_stat_get_tuples_updated(c.oid) + pg_stat_get_tuples_deleted(c.oid)) / 
                   (pg_stat_get_tuples_inserted(c.oid) + pg_stat_get_tuples_updated(c.oid) + pg_stat_get_tuples_deleted(c.oid)), 2)
          ELSE 0
        END as bloat_percentage
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE relkind = 'r'
      AND n.nspname = 'public'
      AND pg_total_relation_size(c.oid) > 1048576  -- > 1MB
      ORDER BY bloat_percentage DESC
    `;
    
    return (result as any[]).filter(row => row.bloat_percentage > 20);
  }
}
```

### 2. Backup and Recovery

#### Automated Backups
```typescript
// src/services/backup.service.ts
export class BackupService {
  async createBackup(type: 'full' | 'incremental' = 'full'): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `votelens-${type}-${timestamp}`;
    
    try {
      if (type === 'full') {
        await this.createFullBackup(backupName);
      } else {
        await this.createIncrementalBackup(backupName);
      }
      
      // Verify backup
      const verified = await this.verifyBackup(backupName);
      
      // Clean old backups
      await this.cleanupOldBackups();
      
      return {
        success: true,
        backupName,
        type,
        size: await this.getBackupSize(backupName),
        verified,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`Backup failed:`, error);
      return {
        success: false,
        backupName,
        type,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
  
  private async createFullBackup(backupName: string): Promise<void> {
    const command = `pg_dump ${process.env.DATABASE_URL} --format=custom --compress=9 --file=/backups/${backupName}.dump`;
    
    await this.executeCommand(command);
    console.log(`Full backup created: ${backupName}`);
  }
  
  private async verifyBackup(backupName: string): Promise<boolean> {
    try {
      const command = `pg_restore --list /backups/${backupName}.dump`;
      const result = await this.executeCommand(command);
      return result.exitCode === 0;
    } catch (error) {
      console.error(`Backup verification failed:`, error);
      return false;
    }
  }
}
```

---

## Scaling Strategies

### 1. Read Replica Configuration

#### Read Replica Setup
```typescript
// src/services/read-replica.service.ts
export class ReadReplicaService {
  private primary: PrismaClient;
  private replicas: PrismaClient[];
  private currentReplicaIndex = 0;
  
  constructor() {
    this.primary = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    });
    
    this.replicas = this.initializeReplicas();
  }
  
  private initializeReplicas(): PrismaClient[] {
    const replicaUrls = [
      process.env.REPLICA_URL_1,
      process.env.REPLICA_URL_2,
      process.env.REPLICA_URL_3
    ].filter(Boolean);
    
    return replicaUrls.map(url => 
      new PrismaClient({
        datasources: { db: { url } }
      })
    );
  }
  
  getReadReplica(): PrismaClient {
    if (this.replicas.length === 0) {
      return this.primary;
    }
    
    // Round-robin selection
    const replica = this.replicas[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicas.length;
    
    return replica;
  }
  
  getPrimary(): PrismaClient {
    return this.primary;
  }
  
  async executeRead<T>(
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const replica = this.getReadReplica();
    
    try {
      return await operation(replica);
    } catch (error) {
      // Fallback to primary if replica fails
      console.warn('Read replica failed, falling back to primary:', error);
      return await operation(this.primary);
    }
  }
  
  async executeWrite<T>(
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await operation(this.primary);
  }
}
```

#### Replication Lag Monitoring
```typescript
// src/services/replication-monitor.service.ts
export class ReplicationMonitorService {
  async getReplicationLag(): Promise<ReplicationLag[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        application_name as replica_name,
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) as lag_bytes,
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) / 1024 / 1024 as lag_mb,
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) / 1024 / 1024 / 1024 as lag_gb,
        EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds,
        state,
        sync_state
      FROM pg_stat_replication
      ORDER BY lag_bytes DESC
    `;
    
    return result as ReplicationLag[];
  }
  
  async checkReplicationHealth(): Promise<ReplicationHealth> {
    const lags = await this.getReplicationLag();
    
    const health: ReplicationHealth = {
      status: 'healthy',
      replicas: [],
      maxLagSeconds: 0,
      timestamp: new Date()
    };
    
    for (const lag of lags) {
      health.replicas.push({
        name: lag.replica_name,
        lagSeconds: lag.lag_seconds,
        lagMB: lag.lag_mb,
        state: lag.state,
        syncState: lag.sync_state
      });
      
      if (lag.lag_seconds > health.maxLagSeconds) {
        health.maxLagSeconds = lag.lag_seconds;
      }
      
      // Determine health status
      if (lag.lag_seconds > 60) { // 1 minute
        health.status = 'degraded';
      }
      
      if (lag.lag_seconds > 300) { // 5 minutes
        health.status = 'critical';
      }
    }
    
    return health;
  }
}
```

### 2. Connection Pool Scaling

#### Dynamic Pool Sizing
```typescript
// src/services/dynamic-pool.service.ts
export class DynamicPoolService {
  private basePoolSize: number = 10;
  private maxPoolSize: number = 50;
  private currentPoolSize: number;
  private metrics: MetricsService;
  
  constructor() {
    this.currentPoolSize = this.basePoolSize;
    this.metrics = new MetricsService();
    this.startDynamicAdjustment();
  }
  
  private startDynamicAdjustment(): void {
    setInterval(async () => {
      await this.adjustPoolSize();
    }, 60000); // Check every minute
  }
  
  private async adjustPoolSize(): Promise<void> {
    const metrics = await this.getPoolMetrics();
    const recommendedSize = this.calculateOptimalPoolSize(metrics);
    
    if (recommendedSize !== this.currentPoolSize) {
      await this.resizePool(recommendedSize);
    }
  }
  
  private calculateOptimalPoolSize(metrics: PoolMetrics): number {
    let newSize = this.currentPoolSize;
    
    // Scale up if high utilization
    if (metrics.utilization > 0.8 && metrics.waitTime > 100) {
      newSize = Math.min(this.currentPoolSize + 5, this.maxPoolSize);
    }
    
    // Scale down if low utilization
    if (metrics.utilization < 0.3 && metrics.waitTime < 10) {
      newSize = Math.max(this.currentPoolSize - 2, this.basePoolSize);
    }
    
    return newSize;
  }
  
  private async resizePool(newSize: number): Promise<void> {
    try {
      // Update Prisma client configuration
      await this.updatePrismaPoolSize(newSize);
      
      this.currentPoolSize = newSize;
      console.log(`Pool size adjusted to ${newSize}`);
      
      this.metrics.recordGauge('db_pool_size', newSize);
      
    } catch (error) {
      console.error('Failed to resize pool:', error);
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Connection Pooling (Week 1)
- [ ] Set up PgBouncer
- [ ] Configure Prisma connection pooling
- [ ] Implement connection monitoring
- [ ] Set up connection alerts
- [ ] Test pool performance

### Phase 2: Query Optimization (Week 2)
- [ ] Implement slow query tracking
- [ ] Add query optimization service
- [ ] Create efficient pagination
- [ ] Optimize aggregations
- [ ] Set up query monitoring

### Phase 3: Indexing Strategy (Week 3)
- [ ] Create critical indexes
- [ ] Implement partial indexes
- [ ] Set up index monitoring
- [ ] Create index optimization service
- [ ] Analyze index usage

### Phase 4: Performance Monitoring (Week 4)
- [ ] Set up pg_stat_statements
- [ ] Implement health monitoring
- [ ] Create performance dashboards
- [ ] Set up automated maintenance
- [ ] Configure backup system

---

## Performance Targets

### Connection Pool Metrics
- **Active Connections**: <80% of max
- **Connection Wait Time**: <50ms
- **Pool Utilization**: 60-80%
- **Connection Errors**: <0.1%

### Query Performance
- **Average Query Time**: <100ms
- **95th Percentile**: <500ms
- **Slow Queries**: <1% of total
- **Index Hit Rate**: >95%

### Database Health
- **Replication Lag**: <5 seconds
- **Disk Usage**: <80%
- **Cache Hit Rate**: >90%
- **Vacuum Frequency**: Weekly

---

## Conclusion

This PostgreSQL optimization guide provides comprehensive strategies for maximizing VoteLens AI database performance on Railway. The combination of connection pooling, query optimization, strategic indexing, and continuous monitoring ensures optimal database performance as the application scales.

Regular monitoring and maintenance are essential for maintaining optimal performance. The automated tools and services provided in this guide help ensure the database continues to perform well under varying loads.
