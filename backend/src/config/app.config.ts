import { z } from 'zod';

/**
 * Centralized Application Configuration
 * Consolidates all configuration management with validation and environment-specific overrides
 */

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // AI Services
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gemini-pro'),
  AI_MAX_TOKENS: z.coerce.number().default(2048),
  AI_TEMPERATURE: z.coerce.number().default(0.7),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Upload
  UPLOAD_MAX_SIZE: z.coerce.number().default(10485760), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('csv,xlsx,xls,json'),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Cache
  CACHE_TTL_SECONDS: z.coerce.number().default(3600),
  CACHE_MAX_SIZE: z.coerce.number().default(1000),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
});

export type Env = z.infer<typeof envSchema>;

// Configuration interface
export interface AppConfig {
  env: Env;
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  upload: UploadConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
}

export interface DatabaseConfig {
  url: string;
  pool: {
    min: number;
    max: number;
  };
}

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  enabled: boolean;
}

export interface AIConfig {
  gemini: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  openai?: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  cacheEnabled: boolean;
  costTrackingEnabled: boolean;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface CORSConfig {
  origin: string;
  credentials: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  directory: string;
}

export interface CacheConfig {
  ttlSeconds: number;
  maxSize: number;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'pretty';
}

// Configuration class
class ConfigManager {
  private config: AppConfig | null = null;

  /**
   * Load and validate configuration from environment variables
   */
  load(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // Validate environment variables
    const env = envSchema.parse(process.env);

    // Build configuration object
    this.config = {
      env,
      database: {
        url: env.DATABASE_URL,
        pool: {
          min: env.DATABASE_POOL_MIN,
          max: env.DATABASE_POOL_MAX,
        },
      },
      redis: {
        url: env.REDIS_URL,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        enabled: !!(env.REDIS_URL || env.REDIS_HOST),
      },
      ai: {
        gemini: {
          apiKey: env.GEMINI_API_KEY,
          model: env.AI_MODEL,
          maxTokens: env.AI_MAX_TOKENS,
          temperature: env.AI_TEMPERATURE,
        },
        openai: env.OPENAI_API_KEY ? {
          apiKey: env.OPENAI_API_KEY,
          model: 'gpt-4',
          maxTokens: env.AI_MAX_TOKENS,
          temperature: env.AI_TEMPERATURE,
        } : undefined,
        cacheEnabled: true,
        costTrackingEnabled: true,
      },
      jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: env.CORS_CREDENTIALS,
      },
      rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      },
      upload: {
        maxSize: env.UPLOAD_MAX_SIZE,
        allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
        directory: env.UPLOAD_DIR,
      },
      cache: {
        ttlSeconds: env.CACHE_TTL_SECONDS,
        maxSize: env.CACHE_MAX_SIZE,
      },
      logging: {
        level: env.LOG_LEVEL,
        format: env.LOG_FORMAT,
      },
    };

    return this.config;
  }

  /**
   * Get configuration
   */
  get(): AppConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  /**
   * Get specific config section
   */
  getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.get()[section];
  }

  /**
   * Reload configuration (useful for testing or config changes)
   */
  reload(): AppConfig {
    this.config = null;
    return this.load();
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    try {
      this.load();
      return { valid: true, errors: [] };
    } catch (err) {
      const error = err as z.ZodError | Error;
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Get configuration for specific environment
   */
  getForEnvironment(env: 'development' | 'production' | 'test'): AppConfig {
    const config = this.get();
    
    // Override specific settings based on environment
    const overrides: Partial<AppConfig> = {
      logging: {
        ...config.logging,
        level: env === 'production' ? 'warn' : 'debug',
        format: env === 'production' ? 'json' : 'pretty',
      },
      ai: {
        ...config.ai,
        costTrackingEnabled: env === 'production',
      },
    };

    return { ...config, ...overrides };
  }
}

// Singleton instance
const configManager = new ConfigManager();

// Export convenience functions
export function getConfig(): AppConfig {
  return configManager.get();
}

export function getConfigSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
  return configManager.getSection(section);
}

export function validateConfig(): { valid: boolean; errors: string[] } {
  return configManager.validate();
}

export function reloadConfig(): AppConfig {
  return configManager.reload();
}

export function getEnvConfig(env: 'development' | 'production' | 'test'): AppConfig {
  return configManager.getForEnvironment(env);
}

export default configManager;
