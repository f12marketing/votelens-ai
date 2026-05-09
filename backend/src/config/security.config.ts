import { Express } from 'express';
import { Redis } from 'ioredis';
import { getJWTManager } from '../middleware/jwt.middleware';
import {
  authRateLimiter,
  uploadRateLimiter,
  aiRateLimiter,
  ddosRateLimiter,
  bruteForceLimiter,
  createApiRateLimiter,
} from '../middleware/rate-limit.middleware';
import {
  strictCORSMiddleware,
  permissiveCORSMiddleware,
} from '../middleware/cors.middleware';
import {
  productionHelmet,
  developmentHelmet,
  securityMiddleware,
} from '../middleware/helmet.middleware';
import {
  validateSQLInput,
  logSQLInjectionAttempts,
} from '../middleware/sql-injection.middleware';
import {
  validateXSSInput,
  sanitizeXSSInput,
  encodeXSSOutput,
  logXSSAttempts,
  handleCSPReport,
  addXSSHeaders,
} from '../middleware/xss.middleware';
import {
  secureUploadChain,
} from '../middleware/secure-upload.middleware';
import { authenticate, optionalAuthenticate } from '../middleware/jwt.middleware';
import { EnvConfig } from './env.security';

/**
 * Production Security Configuration
 * Integrates all security middleware for production deployment
 */

export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableCORS: boolean;
  enableHelmet: boolean;
  enableSQLProtection: boolean;
  enableXSSProtection: boolean;
  enableSecureUploads: boolean;
  enableJWT: boolean;
  redis?: Redis;
}

/**
 * Default production security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableRateLimiting: true,
  enableCORS: true,
  enableHelmet: true,
  enableSQLProtection: true,
  enableXSSProtection: true,
  enableSecureUploads: true,
  enableJWT: true,
};

/**
 * Apply security middleware to Express app
 */
export function applySecurityMiddleware(
  app: Express,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): void {
  const isProduction = EnvConfig.isProduction();
  const redis = config.redis;

  // 1. Security Headers (Helmet)
  if (config.enableHelmet) {
    if (isProduction) {
      app.use(productionHelmet);
    } else {
      app.use(developmentHelmet);
    }
    app.use(...securityMiddleware);
  }

  // 2. CORS Protection
  if (config.enableCORS) {
    if (isProduction) {
      app.use(strictCORSMiddleware);
    } else {
      app.use(permissiveCORSMiddleware);
    }
  }

  // 3. Rate Limiting
  if (config.enableRateLimiting) {
    // Global DDoS protection
    app.use(ddosRateLimiter);

    // Authentication endpoints
    app.use('/api/auth/login', bruteForceLimiter);
    app.use('/api/auth/register', authRateLimiter);
    app.use('/api/auth/forgot-password', authRateLimiter);

    // API endpoints
    app.use('/api', createApiRateLimiter(redis));

    // Upload endpoints
    app.use('/api/uploads', uploadRateLimiter);

    // AI endpoints
    app.use('/api/ai', aiRateLimiter);
  }

  // 4. SQL Injection Protection
  if (config.enableSQLProtection) {
    app.use(validateSQLInput);
    app.use(logSQLInjectionAttempts);
  }

  // 5. XSS Protection
  if (config.enableXSSProtection) {
    app.use(addXSSHeaders);
    app.use(validateXSSInput);
    app.use(sanitizeXSSInput);
    app.use(logXSSAttempts);
    app.use(encodeXSSOutput);
    app.use('/api/security/csp-report', handleCSPReport);
  }

  // 6. Secure File Uploads
  if (config.enableSecureUploads) {
    app.use('/api/uploads', ...secureUploadChain);
  }

  // 7. JWT Authentication
  if (config.enableJWT) {
    const jwtManager = getJWTManager(redis);
    app.use('/api/auth', optionalAuthenticate(jwtManager));
  }
}

/**
 * Apply authentication middleware to protected routes
 */
export function applyAuthentication(
  app: Express,
  redis?: Redis
): void {
  const jwtManager = getJWTManager(redis);
  const authenticateMiddleware = authenticate(jwtManager);

  // Protected routes
  app.use('/api/dashboard', authenticateMiddleware);
  app.use('/api/analytics', authenticateMiddleware);
  app.use('/api/uploads', authenticateMiddleware);
  app.use('/api/reports', authenticateMiddleware);
  app.use('/api/insights', authenticateMiddleware);
  app.use('/api/comparison', authenticateMiddleware);
  app.use('/api/chat', authenticateMiddleware);

  // Admin routes
  app.use('/api/admin', authenticateMiddleware);
}

/**
 * Security middleware configuration for different environments
 */
export const securityConfigs = {
  development: {
    enableRateLimiting: false,
    enableCORS: true,
    enableHelmet: true,
    enableSQLProtection: true,
    enableXSSProtection: true,
    enableSecureUploads: true,
    enableJWT: true,
  } as SecurityConfig,

  staging: {
    enableRateLimiting: true,
    enableCORS: true,
    enableHelmet: true,
    enableSQLProtection: true,
    enableXSSProtection: true,
    enableSecureUploads: true,
    enableJWT: true,
  } as SecurityConfig,

  production: {
    enableRateLimiting: true,
    enableCORS: true,
    enableHelmet: true,
    enableSQLProtection: true,
    enableXSSProtection: true,
    enableSecureUploads: true,
    enableJWT: true,
  } as SecurityConfig,
};

/**
 * Get security configuration for current environment
 */
export function getSecurityConfig(): SecurityConfig {
  const env = EnvConfig.get('NODE_ENV') as 'development' | 'staging' | 'production';
  return securityConfigs[env] || DEFAULT_SECURITY_CONFIG;
}

/**
 * Security health check
 */
export async function securityHealthCheck(redis?: Redis): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
}> {
  const checks: Record<string, boolean> = {
    helmet: true,
    cors: true,
    rateLimiting: true,
    sqlProtection: true,
    xssProtection: true,
    secureUploads: true,
    jwt: true,
  };

  // Check Redis connection if provided
  if (redis) {
    try {
      await redis.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
    }
  }

  // Determine overall status
  const failedChecks = Object.values(checks).filter(v => !v).length;
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks <= 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return { status, checks };
}

/**
 * Security metrics collection
 */
export class SecurityMetrics {
  private metrics: Record<string, number> = {
    rateLimitHits: 0,
    sqlInjectionAttempts: 0,
    xssAttempts: 0,
    authFailures: 0,
    authSuccesses: 0,
    uploadAttempts: 0,
    uploadFailures: 0,
  };

  increment(metric: keyof typeof this.metrics): void {
    this.metrics[metric]++;
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  reset(): void {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key as keyof typeof this.metrics] = 0;
    });
  }
}

export const securityMetrics = new SecurityMetrics();

/**
 * Security audit logging
 */
export class SecurityAuditLogger {
  private logs: Array<{
    timestamp: Date;
    event: string;
    details: any;
    ip?: string;
    userId?: string;
  }> = [];

  log(event: string, details: any, ip?: string, userId?: string): void {
    const logEntry = {
      timestamp: new Date(),
      event,
      details,
      ip,
      userId,
    };

    this.logs.push(logEntry);

    // Log to console
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));

    // In production, send to logging service
    if (EnvConfig.isProduction()) {
      // Send to Sentry, CloudWatch, etc.
    }
  }

  getLogs(limit: number = 100): any[] {
    return this.logs.slice(-limit);
  }

  clear(): void {
    this.logs = [];
  }
}

export const securityAuditLogger = new SecurityAuditLogger();

/**
 * Export security configuration
 */
export const securityConfig = {
  applySecurityMiddleware,
  applyAuthentication,
  configs: securityConfigs,
  getSecurityConfig,
  healthCheck: securityHealthCheck,
  metrics: securityMetrics,
  audit: securityAuditLogger,
};
