import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise-grade SQL Injection Protection
 * Input validation, sanitization, and query protection
 */

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  // Basic SQL injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|WHERE)\b)/i,
  // Comment-based attacks
  /(--|\/\*|\*\/|;)/,
  // Conditional-based attacks
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  // Time-based attacks
  /(WAITFOR\s+DELAY|SLEEP\(|BENCHMARK\(|pg_sleep\()/i,
  // Boolean-based attacks
  /(\b(OR|AND)\b\s+'[^']+'\s*=\s*'[^']+')/i,
  // Stack-based attacks
  /(\b(SELECT|INSERT|UPDATE|DELETE)\b.*;\s*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
  // Hex encoding
  /(0x[0-9a-fA-F]+)/,
  // Base64 encoding patterns
  /(char\(|ascii\(|substring\()/i,
  // ORDER BY attacks
  /(ORDER\s+BY\s+\d+)/i,
  // UNION-based attacks
  /(UNION\s+(ALL\s+)?SELECT)/i,
];

/**
 * Dangerous SQL keywords
 */
const DANGEROUS_KEYWORDS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'EXEC',
  'EXECUTE',
  'UNION',
  'WHERE',
  'HAVING',
  'GROUP',
  'ORDER',
  'BY',
  'JOIN',
  'INNER',
  'OUTER',
  'LEFT',
  'RIGHT',
  'CROSS',
  'NATURAL',
];

/**
 * Input sanitization for SQL protection
 */
export class SQLSanitizer {
  /**
   * Sanitize a string input
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Escape single quotes (basic protection)
    sanitized = sanitized.replace(/'/g, "''");

    // Remove backticks
    sanitized = sanitized.replace(/`/g, '');

    // Remove semicolons
    sanitized = sanitized.replace(/;/g, '');

    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any): number {
    const num = Number(input);
    if (isNaN(num)) {
      throw new Error('Invalid numeric input');
    }
    return num;
  }

  /**
   * Sanitize array input
   */
  static sanitizeArray(input: any[]): any[] {
    return input.map(item => {
      if (typeof item === 'string') {
        return this.sanitizeString(item);
      } else if (typeof item === 'number') {
        return this.sanitizeNumber(item);
      }
      return item;
    });
  }

  /**
   * Sanitize object input
   */
  static sanitizeObject(input: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = this.sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = this.sanitizeArray(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate input against SQL injection patterns
   */
  static detectSQLInjection(input: string): boolean {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for dangerous keywords
   */
  static hasDangerousKeywords(input: string): boolean {
    const upperInput = input.toUpperCase();
    return DANGEROUS_KEYWORDS.some(keyword => upperInput.includes(keyword));
  }
}

/**
 * Input validation middleware
 */
export const validateSQLInput = (req: Request, res: Response, next: NextFunction) => {
  const checkInput = (value: any, path: string = ''): boolean => {
    if (typeof value === 'string') {
      if (SQLSanitizer.detectSQLInjection(value)) {
        console.warn(`SQL injection attempt detected at ${path}: ${value}`);
        return false;
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (!checkInput(value[i], `${path}[${i}]`)) {
          return false;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (!checkInput(val, `${path}.${key}`)) {
          return false;
        }
      }
    }
    return true;
  };

  // Check request body
  if (req.body && !checkInput(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid input detected',
      },
    });
  }

  // Check query parameters
  if (req.query && !checkInput(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid query parameters',
      },
    });
  }

  // Check route parameters
  if (req.params && !checkInput(req.params, 'params')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid route parameters',
      },
    });
  }

  next();
};

/**
 * Parameterized query builder
 * Ensures all queries use parameterization instead of string concatenation
 */
export class QueryBuilder {
  private parameters: any[] = [];
  private whereClause: string[] = [];
  private selectClause: string[] = [];
  private orderByClause: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  /**
   * Add a parameter
   */
  addParameter(value: any): number {
    this.parameters.push(value);
    return this.parameters.length - 1;
  }

  /**
   * Add a WHERE condition with parameterization
   */
  where(column: string, operator: string, value: any): this {
    const paramIndex = this.addParameter(value);
    this.whereClause.push(`${column} ${operator} $${paramIndex + 1}`);
    return this;
  }

  /**
   * Add a WHERE IN condition
   */
  whereIn(column: string, values: any[]): this {
    const paramIndexes = values.map(v => this.addParameter(v));
    const placeholders = paramIndexes.map(i => `$${i + 1}`).join(', ');
    this.whereClause.push(`${column} IN (${placeholders})`);
    return this;
  }

  /**
   * Add SELECT columns
   */
  select(columns: string[]): this {
    this.selectClause.push(...columns);
    return this;
  }

  /**
   * Add ORDER BY
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    // Validate column name to prevent injection
    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
      throw new Error('Invalid column name');
    }
    this.orderByClause.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add LIMIT
   */
  limit(value: number): this {
    this.limitValue = SQLSanitizer.sanitizeNumber(value);
    return this;
  }

  /**
   * Add OFFSET
   */
  offset(value: number): this {
    this.offsetValue = SQLSanitizer.sanitizeNumber(value);
    return this;
  }

  /**
   * Build the query
   */
  build(table: string): { sql: string; parameters: any[] } {
    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error('Invalid table name');
    }

    let sql = 'SELECT';

    if (this.selectClause.length > 0) {
      sql += ' ' + this.selectClause.join(', ');
    } else {
      sql += ' *';
    }

    sql += ` FROM ${table}`;

    if (this.whereClause.length > 0) {
      sql += ' WHERE ' + this.whereClause.join(' AND ');
    }

    if (this.orderByClause.length > 0) {
      sql += ' ORDER BY ' + this.orderByClause.join(', ');
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return {
      sql,
      parameters: this.parameters,
    };
  }

  /**
   * Reset the builder
   */
  reset(): void {
    this.parameters = [];
    this.whereClause = [];
    this.selectClause = [];
    this.orderByClause = [];
    this.limitValue = undefined;
    this.offsetValue = undefined;
  }
}

/**
 * ORM-safe query wrapper
 * Ensures Sequelize queries are safe from SQL injection
 */
export class SafeQuery {
  /**
   * Safe find operation
   */
  static async safeFind(model: any, options: any = {}) {
    // Validate options to prevent injection
    if (options.where && typeof options.where === 'object') {
      // Recursively validate where clause
      this.validateWhereClause(options.where);
    }

    if (options.order) {
      // Validate order clause
      if (typeof options.order === 'string') {
        if (!/^[a-zA-Z0-9_\s,]+$/.test(options.order)) {
          throw new Error('Invalid order clause');
        }
      }
    }

    return await model.findAll(options);
  }

  /**
   * Validate WHERE clause recursively
   */
  private static validateWhereClause(where: any): void {
    for (const [key, value] of Object.entries(where)) {
      if (typeof value === 'string') {
        if (SQLSanitizer.detectSQLInjection(value)) {
          throw new Error('SQL injection detected in WHERE clause');
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateWhereClause(value);
      }
    }
  }

  /**
   * Safe create operation
   */
  static async safeCreate(model: any, data: any) {
    // Sanitize input data
    const sanitized = SQLSanitizer.sanitizeObject(data);
    return await model.create(sanitized);
  }

  /**
   * Safe update operation
   */
  static async safeUpdate(model: any, id: string | number, data: any) {
    // Sanitize input data
    const sanitized = SQLSanitizer.sanitizeObject(data);
    return await model.update(sanitized, { where: { id } });
  }

  /**
   * Safe delete operation
   */
  static async safeDelete(model: any, id: string | number) {
    // Validate ID
    const safeId = SQLSanitizer.sanitizeNumber(id);
    return await model.destroy({ where: { id: safeId } });
  }
}

/**
 * SQL injection logging middleware
 */
export const logSQLInjectionAttempts = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (res.statusCode === 400) {
      try {
        const body = typeof data === 'string' ? JSON.parse(data) : data;
        if (body.error?.code === 'INVALID_INPUT') {
          console.error('SQL injection attempt blocked:', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Database connection security middleware
 */
export const secureDatabaseConnection = (req: Request, res: Response, next: NextFunction) => {
  // Ensure database connection is secure
  // This would typically check connection settings
  next();
};

/**
 * Export all SQL injection protection utilities
 */
export const sqlInjectionProtection = {
  sanitizer: SQLSanitizer,
  middleware: validateSQLInput,
  queryBuilder: QueryBuilder,
  safeQuery: SafeQuery,
  logger: logSQLInjectionAttempts,
};
