import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { UserRole } from '../types';

/**
 * Enterprise-grade Rate Limiting Middleware
 * Supports sliding window, Redis-backed storage, and role-based limits
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

/**
 * In-memory store for development/testing
 */
class MemoryStore {
  private hits: Map<string, number[]> = new Map();
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string): Promise<{ totalHits: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.hits.has(key)) {
      this.hits.set(key, []);
    }

    const timestamps = this.hits.get(key)!;
    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(t => t > windowStart);
    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);

    const resetTime = now + this.windowMs;
    return Promise.resolve({ totalHits: validTimestamps.length, resetTime });
  }

  decrement(key: string): Promise<void> {
    const timestamps = this.hits.get(key);
    if (timestamps && timestamps.length > 0) {
      timestamps.pop();
    }
    return Promise.resolve();
  }

  resetKey(key: string): Promise<void> {
    this.hits.delete(key);
    return Promise.resolve();
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.hits.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Redis-backed store for production
 */
class RedisStore {
  private redis: Redis;
  private prefix: string;
  private windowMs: number;

  constructor(redis: Redis, prefix: string = 'rate-limit', windowMs: number) {
    this.redis = redis;
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const redisKey = this.getKey(key);

    // Use Lua script for atomic increment and cleanup
    const luaScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local windowStart = now - window
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Add current timestamp
      redis.call('ZADD', key, now, now)
      
      -- Get count
      local count = redis.call('ZCARD', key)
      
      -- Set expiry
      redis.call('EXPIRE', key, math.ceil(window / 1000))
      
      return count
    `;

    const totalHits = await this.redis.eval(
      luaScript,
      1,
      redisKey,
      this.windowMs,
      now
    );

    const resetTime = now + this.windowMs;
    return { totalHits: Number(totalHits), resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.getKey(key);
    await this.redis.zremrangebyrank(redisKey, -1, -1);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.getKey(key);
    await this.redis.del(redisKey);
  }
}

/**
 * Role-based rate limiting
 */
function getRoleBasedLimit(userRole: UserRole): number {
  const limits: Record<UserRole, number> = {
    [UserRole.GUEST]: 50,
    [UserRole.USER]: 100,
    [UserRole.ANALYST]: 200,
    [UserRole.ADMIN]: 500,
  };
  return limits[userRole] || 100;
}

/**
 * Create enterprise-grade rate limiter
 */
export const createEnterpriseRateLimiter = (config: RateLimitConfig & { redis?: Redis }) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator,
    handler,
    redis,
  } = config;

  const store = redis ? new RedisStore(redis, 'rate-limit', windowMs) : new MemoryStore(windowMs);

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: keyGenerator || ((req: Request) => {
      // Use IP + user ID for user-based limiting
      const userId = (req as any).user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `user:${userId}` : `ip:${ip}`;
    }),
    handler: handler || ((req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
        timestamp: new Date().toISOString(),
      });
    }),
    store: store as any,
  });
};

/**
 * Authentication rate limiter (strict)
 */
export const authRateLimiter = createEnterpriseRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful auth attempts
});

/**
 * API rate limiter (role-based)
 */
export const createApiRateLimiter = (redis?: Redis) => createEnterpriseRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Default, will be adjusted based on role
  message: 'Too many requests, please try again later',
  redis,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role as UserRole;
    const limit = userRole ? getRoleBasedLimit(userRole) : 100;
    
    // Store the limit in the request for later use
    (req as any).rateLimitMax = limit;
    
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `user:${userId}:${userRole}` : `ip:${ip}`;
  },
});

/**
 * Upload rate limiter (very strict)
 */
export const uploadRateLimiter = createEnterpriseRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many upload attempts, please try again later',
});

/**
 * AI API rate limiter (tiered based on usage)
 */
export const aiRateLimiter = createEnterpriseRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 AI requests per 15 minutes
  message: 'Too many AI requests, please try again later',
});

/**
 * Admin rate limiter (higher limits for admins)
 */
export const adminRateLimiter = createEnterpriseRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for admins
  message: 'Admin rate limit exceeded',
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return `admin:${userId}`;
  },
});

/**
 * IP-based rate limiter for DDoS protection
 */
export const ddosRateLimiter = createEnterpriseRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Rate limit exceeded for security reasons',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ddos:${ip}`;
  },
});

/**
 * Brute force protection for login
 */
export const bruteForceLimiter = createEnterpriseRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 failed attempts per hour
  message: 'Account locked due to too many failed attempts',
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req: Request, res: Response) => {
    // Log the brute force attempt
    console.warn(`Brute force attempt detected from IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Account locked due to too many failed attempts. Please contact support.',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Adaptive rate limiter based on system load
 */
export class AdaptiveRateLimiter {
  private baseLimit: number;
  private currentLimit: number;
  private systemLoadThreshold: number;

  constructor(baseLimit: number = 100, systemLoadThreshold: number = 0.8) {
    this.baseLimit = baseLimit;
    this.currentLimit = baseLimit;
    this.systemLoadThreshold = systemLoadThreshold;
  }

  adjustLimit(systemLoad: number) {
    if (systemLoad > this.systemLoadThreshold) {
      // Reduce limit when system is under load
      this.currentLimit = Math.floor(this.baseLimit * 0.5);
    } else {
      this.currentLimit = this.baseLimit;
    }
  }

  getLimit(): number {
    return this.currentLimit;
  }

  createLimiter(redis?: Redis) {
    return createEnterpriseRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: this.currentLimit,
      message: 'System under heavy load, please try again later',
      redis,
    });
  }
}

/**
 * Rate limit middleware factory with custom options
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100,
  message: string = 'Too many requests from this IP, please try again later',
  redis?: Redis
) => {
  return createEnterpriseRateLimiter({
    windowMs,
    max,
    message,
    redis,
  });
};

/**
 * Rate limit bypass for trusted IPs
 */
export const createTrustedIPLimiter = (trustedIPs: string[], redis?: Redis) => {
  const apiLimiter = createApiRateLimiter(redis);
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (trustedIPs.includes(ip)) {
      // Bypass rate limiting for trusted IPs
      return next();
    }
    
    // Apply normal rate limiting
    return apiLimiter(req, res, next);
  };
};

/**
 * Rate limit statistics
 */
export class RateLimitStats {
  private hits: Map<string, number> = new Map();
  private blocked: Map<string, number> = new Map();

  recordHit(key: string) {
    this.hits.set(key, (this.hits.get(key) || 0) + 1);
  }

  recordBlock(key: string) {
    this.blocked.set(key, (this.blocked.get(key) || 0) + 1);
  }

  getStats() {
    return {
      totalHits: Array.from(this.hits.values()).reduce((a, b) => a + b, 0),
      totalBlocked: Array.from(this.blocked.values()).reduce((a, b) => a + b, 0),
      topBlocked: Array.from(this.blocked.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  }

  clear() {
    this.hits.clear();
    this.blocked.clear();
  }
}

export const rateLimitStats = new RateLimitStats();
