import { BaseService } from './base.service';

/**
 * Database Query Optimization Service
 * Provides optimized query patterns and utilities
 */

export class DatabaseOptimizationService extends BaseService {
  /**
   * Get optimized pagination query parameters
   */
  static getPaginationParams(page: number = 1, limit: number = 50) {
    const offset = Math.max(0, (page - 1) * limit);
    const actualLimit = Math.min(limit, 100); // Max limit of 100
    return { offset, limit: actualLimit };
  }

  /**
   * Build optimized select attributes
   * Only selects specified fields to reduce data transfer
   */
  static buildSelect(fields?: string[]): string[] {
    if (!fields || fields.length === 0) {
      return ['*'];
    }
    return fields;
  }

  /**
   * Build optimized where clause for common filters
   */
  static buildWhereClause(filters: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return; // Skip empty values
      }

      if (Array.isArray(value)) {
        where[key] = { $in: value };
      } else if (typeof value === 'object' && value !== null) {
        // Handle operators like $gt, $lt, $ne, etc.
        where[key] = value;
      } else {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Build optimized order by clause
   */
  static buildOrderBy(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'DESC'): any {
    if (!sortBy) {
      return { createdAt: 'DESC' };
    }
    return { [sortBy]: sortOrder };
  }

  /**
   * Add connection pool configuration
   */
  static getConnectionPoolConfig() {
    return {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    };
  }

  /**
   * Get index suggestions for common queries
   */
  static getIndexSuggestions() {
    return [
      // User indexes
      { table: 'users', fields: ['email'], unique: true },
      { table: 'users', fields: ['role'] },
      { table: 'users', fields: ['status'] },
      { table: 'users', fields: ['createdAt'] },

      // Election indexes
      { table: 'elections', fields: ['date'] },
      { table: 'elections', fields: ['status'] },
      { table: 'elections', fields: ['region'] },
      { table: 'elections', fields: ['date', 'status'] },

      // Upload indexes
      { table: 'uploads', fields: ['userId'] },
      { table: 'uploads', fields: ['status'] },
      { table: 'uploads', fields: ['electionId'] },
      { table: 'uploads', fields: ['uploadedAt'] },
      { table: 'uploads', fields: ['userId', 'status'] },

      // Constituency indexes
      { table: 'constituencies', fields: ['region'] },
      { table: 'constituencies', fields: ['voterCount'] },

      // Analytics indexes
      { table: 'analytics', fields: ['electionId'] },
      { table: 'analytics', fields: ['constituencyId'] },
      { table: 'analytics', fields: ['metricType'] },
    ];
  }

  /**
   * Generate SQL for creating indexes
   */
  static generateIndexSQL(): string[] {
    const suggestions = this.getIndexSuggestions();
    const sqlStatements: string[] = [];

    suggestions.forEach(({ table, fields, unique }) => {
      const indexName = `idx_${table}_${fields.join('_')}`;
      const uniqueClause = unique ? 'UNIQUE ' : '';
      sqlStatements.push(
        `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${table} (${fields.join(', ')});`
      );
    });

    return sqlStatements;
  }

  /**
   * Query batching utility
   * Combines multiple queries into a single request
   */
  static async batchQueries<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(q => q()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Eager loading configuration
   * Prevents N+1 query problems
   */
  static getEagerLoadConfig(model: string) {
    const configs: Record<string, string[]> = {
      uploads: ['election', 'constituency', 'user'],
      analytics: ['election', 'constituency'],
      reports: ['user', 'election'],
      insights: ['election', 'constituency'],
    };

    return configs[model] || [];
  }

  /**
   * Query result caching configuration
   */
  static getCacheConfig(endpoint: string) {
    const configs: Record<string, { ttl: number; enabled: boolean }> = {
      'elections.list': { ttl: 300, enabled: true },
      'constituencies.list': { ttl: 600, enabled: true },
      'analytics.summary': { ttl: 60, enabled: true },
      'users.me': { ttl: 0, enabled: false }, // Never cache user-specific data
    };

    return configs[endpoint] || { ttl: 60, enabled: false };
  }

  /**
   * Database query performance monitor
   */
  static createQueryMonitor() {
    const queryTimes: Map<string, number[]> = new Map();

    return {
      record: (query: string, time: number) => {
        if (!queryTimes.has(query)) {
          queryTimes.set(query, []);
        }
        queryTimes.get(query)!.push(time);
      },
      getStats: () => {
        const stats: Record<string, any> = {};
        queryTimes.forEach((times, query) => {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          const max = Math.max(...times);
          const min = Math.min(...times);
          stats[query] = { avg, max, min, count: times.length };
        });
        return stats;
      },
      clear: () => queryTimes.clear(),
    };
  }

  /**
   * Optimized query builder for complex filters
   */
  static buildOptimizedQuery(params: {
    model: string;
    filters?: Record<string, any>;
    select?: string[];
    include?: string[];
    orderBy?: string;
    order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const {
      model,
      filters = {},
      select,
      include,
      orderBy,
      order = 'DESC',
      page = 1,
      limit = 50,
    } = params;

    return {
      where: this.buildWhereClause(filters),
      attributes: this.buildSelect(select),
      include: include ? this.getEagerLoadConfig(model).filter(i => include.includes(i)) : [],
      order: this.buildOrderBy(orderBy, order),
      ...this.getPaginationParams(page, limit),
    };
  }

  /**
   * Read replica routing for read-heavy operations
   */
  static shouldUseReadReplica(operation: 'read' | 'write'): boolean {
    return operation === 'read' && Math.random() > 0.1; // 90% of reads go to replica
  }

  /**
   * Connection pooling for high concurrency
   */
  static configurePool(config?: {
    max?: number;
    min?: number;
    acquire?: number;
    idle?: number;
  }) {
    return {
      ...this.getConnectionPoolConfig(),
      ...config,
    };
  }

  /**
   * Query timeout configuration
   */
  static getQueryTimeout(queryType: 'simple' | 'complex' | 'analytics'): number {
    const timeouts = {
      simple: 5000,      // 5 seconds
      complex: 15000,   // 15 seconds
      analytics: 30000, // 30 seconds
    };
    return timeouts[queryType];
  }

  /**
   * Slow query logger
   */
  static logSlowQuery(query: string, duration: number, threshold: number = 1000) {
    if (duration > threshold) {
      console.warn(`Slow query detected (${duration}ms):`, query.substring(0, 200));
      // In production, send to monitoring service
    }
  }

  /**
   * Query result size optimization
   */
  static optimizeResultSize<T>(data: T[], maxResults: number = 1000): T[] {
    if (data.length <= maxResults) return data;
    console.warn(`Query result size (${data.length}) exceeds limit (${maxResults}), truncating`);
    return data.slice(0, maxResults);
  }

  /**
   * Full-text search optimization
   */
  static buildFullTextSearch(searchTerm: string, fields: string[]): any {
    if (!searchTerm || fields.length === 0) {
      return {};
    }

    const searchConditions = fields.map(field => ({
      [field]: { $like: `%${searchTerm}%` },
    }));

    return { $or: searchConditions };
  }

  /**
   * Aggregate query optimization
   */
  static buildAggregateQuery(params: {
    groupBy: string[];
    aggregations: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
    filters?: Record<string, any>;
    having?: Record<string, any>;
  }) {
    const { groupBy, aggregations, filters, having } = params;

    const select: any = groupBy.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    Object.entries(aggregations).forEach(([field, agg]) => {
      select[`${field}_${agg}`] = this.getAggregateFunction(agg, field);
    });

    return {
      attributes: select,
      group: groupBy,
      where: filters ? this.buildWhereClause(filters) : undefined,
      having: having ? this.buildWhereClause(having) : undefined,
    };
  }

  private static getAggregateFunction(agg: string, field: string) {
    const functions: Record<string, (field: string) => any> = {
      sum: (f) => this.sequelize.fn('SUM', this.sequelize.col(f)),
      avg: (f) => this.sequelize.fn('AVG', this.sequelize.col(f)),
      min: (f) => this.sequelize.fn('MIN', this.sequelize.col(f)),
      max: (f) => this.sequelize.fn('MAX', this.sequelize.col(f)),
      count: (f) => this.sequelize.fn('COUNT', this.sequelize.col(f)),
    };

    return functions[agg]?.(field) || this.sequelize.col(field);
  }

  private static sequelize: any = null;

  static setSequelize(sequelizeInstance: any) {
    this.sequelize = sequelizeInstance;
  }
}

/**
 * Database migration for performance optimizations
 */
export const performanceMigrations = [
  {
    version: '001',
    description: 'Add indexes for common queries',
    up: async (sequelize: any) => {
      const sql = DatabaseOptimizationService.generateIndexSQL();
      for (const statement of sql) {
        await sequelize.query(statement);
      }
    },
    down: async (sequelize: any) => {
      // Drop indexes
      const suggestions = DatabaseOptimizationService.getIndexSuggestions();
      for (const { table, fields } of suggestions) {
        const indexName = `idx_${table}_${fields.join('_')}`;
        await sequelize.query(`DROP INDEX IF EXISTS ${indexName};`);
      }
    },
  },
  {
    version: '002',
    description: 'Add query performance logging table',
    up: async (sequelize: any) => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS query_performance_logs (
          id SERIAL PRIMARY KEY,
          query_hash VARCHAR(64) NOT NULL,
          query_text TEXT NOT NULL,
          duration INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_query_hash (query_hash),
          INDEX idx_timestamp (timestamp)
        );
      `);
    },
    down: async (sequelize: any) => {
      await sequelize.query('DROP TABLE IF EXISTS query_performance_logs;');
    },
  },
];

/**
 * Query analyzer for identifying optimization opportunities
 */
export class QueryAnalyzer {
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

  recordQuery(query: string, duration: number) {
    this.slowQueries.push({ query, duration, timestamp: new Date() });
    
    // Keep only last 1000 queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries = this.slowQueries.slice(-1000);
    }
  }

  getSlowQueries(threshold: number = 1000) {
    return this.slowQueries.filter(q => q.duration > threshold);
  }

  getAverageQueryTime() {
    if (this.slowQueries.length === 0) return 0;
    return this.slowQueries.reduce((sum, q) => sum + q.duration, 0) / this.slowQueries.length;
  }

  getOptimizationSuggestions() {
    const suggestions: string[] = [];
    const avgTime = this.getAverageQueryTime();

    if (avgTime > 500) {
      suggestions.push('Average query time exceeds 500ms. Consider adding indexes.');
    }

    const slowQueries = this.getSlowQueries(1000);
    if (slowQueries.length > 10) {
      suggestions.push(`${slowQueries.length} queries exceed 1s. Review and optimize.`);
    }

    // Check for common patterns
    const hasNPlus1 = this.detectNPlus1();
    if (hasNPlus1) {
      suggestions.push('Potential N+1 query problem detected. Use eager loading.');
    }

    const hasFullTableScan = this.detectFullTableScans();
    if (hasFullTableScan) {
      suggestions.push('Full table scans detected. Add WHERE clauses or indexes.');
    }

    return suggestions;
  }

  private detectNPlus1(): boolean {
    // Simplified detection - in production, analyze actual query patterns
    return this.slowQueries.filter(q => q.duration > 100).length > 50;
  }

  private detectFullTableScans(): boolean {
    // Simplified detection
    return this.slowQueries.some(q => q.duration > 2000);
  }

  clear() {
    this.slowQueries = [];
  }

  getReport() {
    return {
      totalQueries: this.slowQueries.length,
      averageTime: this.getAverageQueryTime(),
      slowQueries: this.getSlowQueries(1000).length,
      suggestions: this.getOptimizationSuggestions(),
    };
  }
}
