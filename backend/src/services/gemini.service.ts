import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseService } from './base.service';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

interface GeminiRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  cached: boolean;
}

interface CacheEntry {
  response: string;
  timestamp: number;
  ttl: number;
}

export class GeminiService extends BaseService {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private config: GeminiConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  constructor(config: GeminiConfig) {
    super();
    this.config = {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
      ...config,
    };

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
      this.logInfo('Gemini service initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize Gemini service', error);
      throw error;
    }
  }

  /**
   * Generate text with retry logic and caching
   */
  async generateText(request: GeminiRequest, useCache: boolean = true): Promise<GeminiResponse> {
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logDebug('Cache hit for Gemini request');
        return {
          text: cached,
          cached: true,
        };
      }
    }

    // Generate with retry logic
    const response = await this.withRetry(async () => {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }

      const fullPrompt = request.context 
        ? `${request.context}\n\n${request.prompt}`
        : request.prompt;

      const result = await this.model.generateContent(fullPrompt);
      
      if (!result.response) {
        throw new Error('No response from Gemini');
      }

      const text = result.response.text();
      const usage = result.response.usageMetadata ? {
        promptTokens: result.response.usageMetadata.promptTokenCount || 0,
        candidatesTokens: result.response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata.totalTokenCount || 0,
      } : undefined;

      // Cache the response
      if (useCache) {
        this.setCache(cacheKey, text);
      }

      return {
        text,
        usage,
        cached: false,
      };
    });

    return response;
  }

  /**
   * Generate text with streaming
   */
  async *generateTextStream(request: GeminiRequest): AsyncGenerator<string, void, unknown> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    const fullPrompt = request.context 
      ? `${request.context}\n\n${request.prompt}`
      : request.prompt;

    const result = await this.model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(
    request: GeminiRequest,
    schema: Record<string, any>
  ): Promise<T> {
    const jsonPrompt = `${request.prompt}\n\nRespond with valid JSON in the following format:\n${JSON.stringify(schema, null, 2)}`;
    
    const response = await this.generateText({
      ...request,
      prompt: jsonPrompt,
    });

    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      this.logError('Failed to parse JSON response', error);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (attempt === maxRetries - 1) {
          this.logError(`Gemini request failed after ${maxRetries} retries`, error);
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        this.logWarn(`Gemini request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Cache management
   */
  private generateCacheKey(request: GeminiRequest): string {
    return `${request.prompt.substring(0, 100)}-${request.context?.substring(0, 100) || ''}-${this.config.model}`;
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCache(key: string, response: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: this.cacheTTL,
    });

    // Clean up old cache entries if cache is too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.logInfo('Gemini cache cleared');
  }

  /**
   * Token optimization
   */
  optimizePrompt(prompt: string): string {
    // Remove excessive whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim();

    // Remove redundant phrases
    optimized = optimized
      .replace(/Please\s+/gi, '')
      .replace(/I would like you to\s+/gi, '')
      .replace(/Can you\s+/gi, '')
      .replace(/Kindly\s+/gi, '');

    // Truncate if too long (Gemini has input limits)
    const maxPromptLength = 30000; // Safe limit
    if (optimized.length > maxPromptLength) {
      optimized = optimized.substring(0, maxPromptLength);
      this.logWarn('Prompt truncated due to length limit');
    }

    return optimized;
  }

  /**
   * Utility functions
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.model) {
        return false;
      }

      const response = await this.model.generateContent('Test');
      return !!response.response;
    } catch (error) {
      this.logError('Gemini health check failed', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(config?: GeminiConfig): GeminiService {
  if (!geminiService && config) {
    geminiService = new GeminiService(config);
  }

  if (!geminiService) {
    throw new Error('Gemini service not initialized. Provide configuration.');
  }

  return geminiService;
}
