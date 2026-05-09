import crypto from 'crypto';
import { RedisCache } from '../middleware/cache.middleware';

/**
 * AI Response Caching Service
 * Implements semantic caching for AI responses to reduce API costs and latency
 */

export interface AIRequest {
  query: string;
  context?: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  electionId?: string;
  constituencyId?: string;
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
  cacheKey: string;
  isCached: boolean;
}

export class AICacheService {
  private redisCache: RedisCache;
  private localCache: Map<string, AIResponse>;
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  };

  constructor(redisClient?: any) {
    this.redisCache = redisClient ? new RedisCache(redisClient, 'ai-cache') : null as any;
    this.localCache = new Map();
  }

  /**
   * Generate a semantic cache key from the request
   * Uses hash of query + relevant parameters
   */
  private generateCacheKey(request: AIRequest): string {
    const normalizedQuery = request.query.trim().toLowerCase();
    const keyData = {
      query: normalizedQuery,
      model: request.model || 'default',
      temperature: request.temperature || 0.7,
      electionId: request.electionId,
      constituencyId: request.constituencyId,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Get cached AI response
   * Checks local cache first, then Redis
   */
  async get(request: AIRequest): Promise<AIResponse | null> {
    const cacheKey = this.generateCacheKey(request);

    // Check local cache first (fastest)
    const localHit = this.localCache.get(cacheKey);
    if (localHit) {
      this.cacheStats.hits++;
      return { ...localHit, isCached: true };
    }

    // Check Redis cache
    if (this.redisCache) {
      try {
        const cached = await this.redisCache.get(cacheKey);
        if (cached) {
          // Store in local cache for subsequent requests
          this.localCache.set(cacheKey, cached);
          this.cacheStats.hits++;
          return { ...cached, isCached: true };
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    this.cacheStats.misses++;
    return null;
  }

  /**
   * Set AI response in cache
   */
  async set(request: AIRequest, response: Omit<AIResponse, 'cacheKey' | 'isCached'>): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const cacheEntry: AIResponse = {
      ...response,
      cacheKey,
      isCached: false,
    };

    // Set in local cache (with expiry)
    this.localCache.set(cacheKey, cacheEntry);
    
    // Expire local cache entries after 5 minutes
    setTimeout(() => {
      this.localCache.delete(cacheKey);
    }, 5 * 60 * 1000);

    // Set in Redis cache (24 hour TTL)
    if (this.redisCache) {
      try {
        await this.redisCache.set(cacheKey, cacheEntry, 86400); // 24 hours
        this.cacheStats.sets++;
      } catch (error) {
        console.error('Redis cache set error:', error);
      }
    }
  }

  /**
   * Invalidate cache for specific request
   */
  async invalidate(request: AIRequest): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    
    this.localCache.delete(cacheKey);
    
    if (this.redisCache) {
      try {
        await this.redisCache.delete(cacheKey);
        this.cacheStats.invalidations++;
      } catch (error) {
        console.error('Redis cache invalidation error:', error);
      }
    }
  }

  /**
   * Invalidate all cache entries for a specific election
   * Called when election data is updated
   */
  async invalidateByElection(electionId: string): Promise<void> {
    // Invalidate local cache entries matching the election
    const keysToDelete: string[] = [];
    
    this.localCache.forEach((value, key) => {
      if (value.text.includes(electionId)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.localCache.delete(key));
    
    // Invalidate Redis cache (pattern-based)
    if (this.redisCache) {
      try {
        await this.redisCache.invalidatePattern(electionId);
        this.cacheStats.invalidations += keysToDelete.length;
      } catch (error) {
        console.error('Redis pattern invalidation error:', error);
      }
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmCache(commonQueries: Array<{ request: AIRequest; response: Omit<AIResponse, 'cacheKey' | 'isCached'> }>): Promise<void> {
    const promises = commonQueries.map(({ request, response }) =>
      this.set(request, response)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    
    return {
      ...this.cacheStats,
      hitRate,
      localCacheSize: this.localCache.size,
      savings: this.calculateSavings(),
    };
  }

  /**
   * Calculate cost savings from caching
   */
  private calculateSavings(): number {
    const avgTokensPerRequest = 1000;
    const avgCostPerToken = 0.0001; // $0.0001 per token (example)
    
    const tokensSaved = this.cacheStats.hits * avgTokensPerRequest;
    return tokensSaved * avgCostPerToken;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.localCache.clear();
    
    if (this.redisCache) {
      try {
        await this.redisCache.clear();
      } catch (error) {
        console.error('Redis cache clear error:', error);
      }
    }
  }

  /**
   * Get cache health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    localCacheSize: number;
    redisConnected: boolean;
    hitRate: number;
  }> {
    let redisConnected = false;
    
    if (this.redisCache) {
      try {
        // Simple health check
        await this.redisCache.get('health-check');
        redisConnected = true;
      } catch (error) {
        redisConnected = false;
      }
    }

    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    
    return {
      status: redisConnected && hitRate > 0.5 ? 'healthy' : redisConnected ? 'degraded' : 'down',
      localCacheSize: this.localCache.size,
      redisConnected,
      hitRate,
    };
  }

  /**
   * Semantic similarity-based cache lookup
   * For queries that are similar but not identical
   */
  async findSimilar(request: AIRequest, threshold: number = 0.8): Promise<AIResponse | null> {
    // This would use embeddings and similarity search
    // For now, implement simple substring matching
    
    const normalizedQuery = request.query.trim().toLowerCase();
    const words = normalizedQuery.split(/\s+/);
    
    for (const [key, value] of this.localCache.entries()) {
      const cachedQuery = value.text.toLowerCase();
      const matchCount = words.filter(word => cachedQuery.includes(word)).length;
      const similarity = matchCount / words.length;
      
      if (similarity >= threshold) {
        this.cacheStats.hits++;
        return { ...value, isCached: true };
      }
    }
    
    return null;
  }

  /**
   * Cache warming based on analytics
   * Pre-cache responses for frequently asked questions
   */
  async warmBasedOnAnalytics(topQueries: Array<{ query: string; count: number }>): Promise<void> {
    // Sort by frequency and warm top N
    const topN = topQueries.slice(0, 50);
    
    console.log(`Warming cache for ${topN.length} top queries`);
    
    // This would call the AI service to generate responses
    // and cache them for future use
  }

  /**
   * Adaptive TTL based on query frequency
   */
  private getAdaptiveTTL(query: string): number {
    // More frequent queries get longer TTL
    // This would be based on analytics data
    const baseTTL = 86400; // 24 hours
    const frequencyMultiplier = 1; // Would be calculated from analytics
    
    return baseTTL * frequencyMultiplier;
  }

  /**
   * Cache key with versioning
   * Allows for cache invalidation when model or data changes
   */
  private generateVersionedKey(request: AIRequest, version: string): string {
    const baseKey = this.generateCacheKey(request);
    return `${baseKey}:v${version}`;
  }

  /**
   * Incremental cache warming
   * Gradually warm cache based on actual usage patterns
   */
  async incrementalWarm(queries: AIRequest[], batchSize: number = 10): Promise<void> {
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      // Process batch
      for (const query of batch) {
        const cached = await this.get(query);
        if (!cached) {
          // Would generate and cache response
          console.log(`Warming cache for query: ${query.query.substring(0, 50)}...`);
        }
      }
      
      // Delay between batches to avoid overwhelming the AI service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Cache size management
   */
  manageCacheSize(maxSize: number = 1000): void {
    if (this.localCache.size > maxSize) {
      // Remove oldest entries (LRU)
      const keys = Array.from(this.localCache.keys());
      const keysToRemove = keys.slice(0, keys.length - maxSize);
      
      keysToRemove.forEach(key => this.localCache.delete(key));
    }
  }
}

/**
 * AI Cache Middleware
 * Express middleware for automatic AI response caching
 */
export function aiCacheMiddleware(aiCacheService: AICacheService) {
  return async (req: any, res: any, next: any) => {
    const originalSend = res.send;
    const aiRequest: AIRequest = {
      query: req.body.query,
      context: req.body.context,
      model: req.body.model,
      temperature: req.body.temperature,
      maxTokens: req.body.maxTokens,
      userId: req.user?.id,
      electionId: req.body.electionId,
      constituencyId: req.body.constituencyId,
    };

    // Check cache
    const cached = await aiCacheService.get(aiRequest);
    
    if (cached) {
      res.set('X-AI-Cache', 'HIT');
      return originalSend.call(res, JSON.stringify(cached));
    }

    res.set('X-AI-Cache', 'MISS');

    // Intercept response to cache it
    res.send = function(data: any) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Cache the response
        aiCacheService.set(aiRequest, {
          text: responseData.text || responseData.response,
          tokensUsed: responseData.tokensUsed || 0,
          model: responseData.model || aiRequest.model || 'default',
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error caching AI response:', error);
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Singleton instance
 */
let aiCacheServiceInstance: AICacheService | null = null;

export function getAICacheService(redisClient?: any): AICacheService {
  if (!aiCacheServiceInstance) {
    aiCacheServiceInstance = new AICacheService(redisClient);
  }
  return aiCacheServiceInstance;
}
