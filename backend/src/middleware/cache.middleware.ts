import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Cache configuration
 */
interface CacheConfig {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  skipCache?: boolean;
  cacheHeaders?: {
    'Cache-Control'?: string;
    'ETag'?: string;
  };
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag?: string;
}

/**
 * In-memory cache (replace with Redis in production)
 */
class CacheStore {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag: this.generateETag(data),
    });
    this.stats.sets++;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.stats.deletes++;
  }

  clear(): void {
    this.cache.clear();
  }

  generateETag(data: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

const cacheStore = new CacheStore();

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, prefix: string = 'cache'): string {
  const url = req.originalUrl || req.url;
  const method = req.method;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Include query parameters
  const queryString = new URLSearchParams(req.query as any).toString();
  
  return `${prefix}:${method}:${userId}:${url}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Check if client has cached version
 */
function checkClientCache(req: Request, etag: string): boolean {
  const ifNoneMatch = req.get('If-None-Match');
  const ifModifiedSince = req.get('If-Modified-Since');
  
  if (ifNoneMatch && ifNoneMatch === etag) {
    return true;
  }
  
  return false;
}

/**
 * Cache middleware factory
 */
export function cacheMiddleware(config: CacheConfig = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'cache',
    skipCache = false,
    cacheHeaders = {},
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if configured or if it's not a GET request
    if (skipCache || req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req, keyPrefix);
    const cachedData = cacheStore.get(cacheKey);

    if (cachedData) {
      // Check ETag for conditional requests
      if (cachedData.etag && checkClientCache(req, cachedData.etag)) {
        return res.status(304).end();
      }

      // Return cached data
      res.set('X-Cache', 'HIT');
      if (cachedData.etag) {
        res.set('ETag', cachedData.etag);
      }
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data: any) => {
      // Cache the response
      cacheStore.set(cacheKey, data, ttl);

      // Set cache headers
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', cacheHeaders['Cache-Control'] || `public, max-age=${ttl}`);
      
      if (cacheStore.generateETag(data)) {
        res.set('ETag', cacheStore.generateETag(data));
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Bypass cache middleware
 */
export function bypassCache(req: Request, res: Response, next: NextFunction) {
  res.set('X-Cache-Bypass', 'true');
  next();
}

/**
 * Invalidate cache middleware
 */
export function invalidateCache(pattern: string, keyPrefix: string = 'cache') {
  return (req: Request, res: Response, next: NextFunction) => {
    // Invalidate cache after request completes
    res.on('finish', () => {
      if (res.statusCode < 400) {
        // Invalidate matching cache keys
        const keys = Array.from((cacheStore as any).cache.keys());
        keys.forEach(key => {
          if (key.includes(pattern)) {
            cacheStore.delete(key);
          }
        });
      }
    });
    next();
  };
}

/**
 * Cache control middleware for static assets
 */
export function cacheControl(maxAge: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
    next();
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheStore.getStats();
}

/**
 * Clear all cache
 */
export function clearCache() {
  cacheStore.clear();
}

/**
 * Cache invalidation by pattern
 */
export function invalidateCachePattern(pattern: string) {
  const keys = Array.from((cacheStore as any).cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  });
}

/**
 * Redis cache implementation (for production)
 */
export class RedisCache {
  private client: any;
  private prefix: string;

  constructor(redisClient: any, prefix: string = 'votelens') {
    this.client = redisClient;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<any | null> {
    try {
      const data = await this.client.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.client.setex(
        this.getKey(key),
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.prefix}:*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.prefix}:*${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  }
}

// Export cache store for direct access if needed
export { cacheStore };
