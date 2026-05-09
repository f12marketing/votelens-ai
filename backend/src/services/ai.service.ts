import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseService } from './base.service';
import { AICacheService, AIRequest, AIResponse } from './ai-cache.service';

/**
 * Unified AI Service
 * Consolidates all AI-related functionality into a single, production-grade service
 * Features: caching, cost tracking, streaming, batching, prompt optimization
 */

export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  enableCache?: boolean;
  enableStreaming?: boolean;
}

export interface AICost {
  tokensUsed: number;
  cost: number;
  timestamp: number;
  userId?: string;
  endpoint: string;
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
  tokensUsed?: number;
}

export class AIService extends BaseService {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private config: AIConfig;
  private cacheService: AICacheService;
  private costs: AICost[] = [];
  private costTrackingEnabled: boolean = true;

  constructor(config: AIConfig, redisClient?: any) {
    super();
    this.config = {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
      enableCache: true,
      enableStreaming: false,
      ...config,
    };

    this.cacheService = new AICacheService(redisClient);
    this.initialize();
  }

  private initialize(): void {
    try {
      this.client = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.client.getGenerativeModel(this.config.model, {
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });
      this.logInfo('AI service initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize AI service', error);
      throw error;
    }
  }

  /**
   * Generate text with caching and cost tracking
   */
  async generateText(request: Omit<AIRequest, 'model'>, options?: { useCache?: boolean; userId?: string }): Promise<AIResponse> {
    const { useCache = this.config.enableCache, userId } = options || {};
    
    const aiRequest: AIRequest = {
      ...request,
      model: this.config.model,
      userId,
    };

    // Check cache first
    if (useCache) {
      const cached = await this.cacheService.get(aiRequest);
      if (cached) {
        this.logDebug('AI cache hit');
        return cached;
      }
    }

    // Generate response
    const response = await this.withRetry(async () => {
      if (!this.model) {
        throw new Error('AI model not initialized');
      }

      const fullPrompt = request.context 
        ? `${request.context}\n\n${request.query}`
        : request.query;

      const result = await this.model.generateContent(fullPrompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;

      return {
        text,
        tokensUsed: usage?.totalTokenCount || 0,
        model: this.config.model,
        timestamp: Date.now(),
        cacheKey: '',
        isCached: false,
      };
    });

    // Cache the response
    if (useCache) {
      await this.cacheService.set(aiRequest, response);
    }

    // Track cost
    if (this.costTrackingEnabled) {
      await this.trackCost(response.tokensUsed, userId || 'anonymous', 'generateText');
    }

    return response;
  }

  /**
   * Generate streaming response
   */
  async *generateStream(request: Omit<AIRequest, 'model'>, options?: { userId?: string }): AsyncGenerator<AIStreamChunk> {
    const { userId } = options || {};

    const aiRequest: AIRequest = {
      ...request,
      model: this.config.model,
      userId,
    };

    // Check cache first - streaming bypasses cache for real-time responses
    const cached = await this.cacheService.get(aiRequest);
    if (cached) {
      yield { text: cached.text, done: true, tokensUsed: cached.tokensUsed };
      return;
    }

    if (!this.model) {
      throw new Error('AI model not initialized');
    }

    const fullPrompt = request.context 
      ? `${request.context}\n\n${request.query}`
      : request.query;

    const result = await this.model.generateContentStream(fullPrompt);
    let fullText = '';
    let totalTokens = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      yield { text, done: false };
    }

    const usage = (await result.response).usageMetadata;
    totalTokens = usage?.totalTokenCount || 0;

    // Cache the complete response
    const response: AIResponse = {
      text: fullText,
      tokensUsed: totalTokens,
      model: this.config.model,
      timestamp: Date.now(),
      cacheKey: '',
      isCached: false,
    };

    await this.cacheService.set(aiRequest, response);

    // Track cost
    if (this.costTrackingEnabled) {
      await this.trackCost(totalTokens, userId || 'anonymous', 'generateStream');
    }

    yield { text: '', done: true, tokensUsed: totalTokens };
  }

  /**
   * Batch multiple AI requests for efficiency
   */
  async batchGenerate(requests: Array<Omit<AIRequest, 'model'>>, options?: { userId?: string }): Promise<AIResponse[]> {
    const { userId } = options || {};
    const batchSize = 5; // Process 5 requests at a time
    const results: AIResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(request => this.generateText(request, { useCache: true, userId }))
      );
      results.push(...batchResults);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Optimize prompt for cost efficiency
   */
  optimizePrompt(prompt: string): string {
    // Remove redundant whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim();
    
    // Remove common filler phrases
    const fillerPhrases = [
      'Please provide a',
      'I would like you to',
      'Can you please',
      'I need you to',
    ];
    
    for (const phrase of fillerPhrases) {
      optimized = optimized.replace(new RegExp(phrase, 'gi'), '');
    }
    
    return optimized.trim();
  }

  /**
   * Track AI costs
   */
  private async trackCost(tokens: number, userId: string, endpoint: string): Promise<void> {
    const costPerToken = 0.000001; // $0.000001 per token (example rate)
    const cost = tokens * costPerToken;

    const costEntry: AICost = {
      tokensUsed: tokens,
      cost,
      timestamp: Date.now(),
      userId,
      endpoint,
    };

    this.costs.push(costEntry);

    // Keep only last 1000 cost entries in memory
    if (this.costs.length > 1000) {
      this.costs = this.costs.slice(-1000);
    }

    this.logDebug(`AI cost tracked: ${cost.toFixed(6)} USD for ${tokens} tokens`);
  }

  /**
   * Get cost report
   */
  getCostReport(userId?: string, timeRange: number = 86400000): {
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    averageCostPerRequest: number;
    costsByEndpoint: Record<string, number>;
  } {
    const now = Date.now();
    const startTime = now - timeRange;
    
    const filteredCosts = this.costs.filter(cost => {
      const matchesTime = cost.timestamp >= startTime;
      const matchesUser = !userId || cost.userId === userId;
      return matchesTime && matchesUser;
    });

    const totalCost = filteredCosts.reduce((sum, cost) => sum + cost.cost, 0);
    const totalTokens = filteredCosts.reduce((sum, cost) => sum + cost.tokensUsed, 0);
    const requestCount = filteredCosts.length;
    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0;

    const costsByEndpoint: Record<string, number> = {};
    filteredCosts.forEach(cost => {
      costsByEndpoint[cost.endpoint] = (costsByEndpoint[cost.endpoint] || 0) + cost.cost;
    });

    return {
      totalCost,
      totalTokens,
      requestCount,
      averageCostPerRequest,
      costsByEndpoint,
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logWarn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clear();
    this.logInfo('AI cache cleared');
  }

  /**
   * Enable/disable cost tracking
   */
  setCostTracking(enabled: boolean): void {
    this.costTrackingEnabled = enabled;
    this.logInfo(`Cost tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    modelInitialized: boolean;
    cacheHealth: any;
    costTrackingEnabled: boolean;
  }> {
    const cacheHealth = await this.cacheService.getHealth();
    
    return {
      status: this.model ? 'healthy' : 'down',
      modelInitialized: !!this.model,
      cacheHealth,
      costTrackingEnabled: this.costTrackingEnabled,
    };
  }

  /**
   * Warm up cache with common queries
   */
  async warmCache(commonQueries: Array<{ request: Omit<AIRequest, 'model'>; response: Omit<AIResponse, 'cacheKey' | 'isCached'> }>): Promise<void> {
    for (const { request, response } of commonQueries) {
      const aiRequest: AIRequest = {
        ...request,
        model: this.config.model,
      };
      await this.cacheService.set(aiRequest, response);
    }
    this.logInfo(`Warmed cache with ${commonQueries.length} queries`);
  }
}

/**
 * Singleton instance
 */
let aiServiceInstance: AIService | null = null;

export function getAIService(config?: AIConfig, redisClient?: any): AIService | null {
  if (!aiServiceInstance && config) {
    aiServiceInstance = new AIService(config, redisClient);
  }
  return aiServiceInstance;
}

export type { AICacheService, AIRequest, AIResponse };
