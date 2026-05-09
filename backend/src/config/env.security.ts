import dotenv from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Enterprise-grade Environment Variable Security
 * Validation, encryption, and secure configuration management
 */

// Load environment variables
dotenv.config();

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Server Configuration
  PORT: z.string().default('5000'),
  HOST: z.string().default('localhost'),
  
  // Database Configuration
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),
  
  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // API Keys
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // File Upload Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760'),
  
  // CORS Configuration
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Security
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

/**
 * Environment variable validation
 */
export class EnvValidator {
  /**
   * Validate environment variables
   */
  static validate(): z.infer<typeof envSchema> {
    try {
      return envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Environment variable validation failed:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Invalid environment configuration');
      }
      throw error;
    }
  }

  /**
   * Check if required environment variables are set
   */
  static checkRequired(requiredVars: string[]): { missing: string[] } {
    const missing: string[] = [];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    });
    
    return { missing };
  }

  /**
   * Validate environment file exists
   */
  static validateEnvFile(filePath: string): boolean {
    return existsSync(filePath);
  }
}

/**
 * Secure environment variable manager
 */
export class SecureEnvManager {
  private config: z.infer<typeof envSchema>;
  private encryptionKey: string;

  constructor() {
    this.config = EnvValidator.validate();
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  /**
   * Get configuration value
   */
  get(key: keyof z.infer<typeof envSchema>): string {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  getAll(): z.infer<typeof envSchema> {
    return this.config;
  }

  /**
   * Check if in production
   */
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Check if in development
   */
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * Check if in staging
   */
  isStaging(): boolean {
    return this.config.NODE_ENV === 'staging';
  }

  /**
   * Get database URL
   */
  getDatabaseURL(): string {
    const ssl = this.config.DB_SSL === 'true' ? '?sslmode=require' : '';
    return `postgresql://${this.config.DB_USER}:${this.config.DB_PASSWORD}@${this.config.DB_HOST}:${this.config.DB_PORT}/${this.config.DB_NAME}${ssl}`;
  }

  /**
   * Get Redis URL
   */
  getRedisURL(): string {
    const password = this.config.REDIS_PASSWORD ? `:${this.config.REDIS_PASSWORD}@` : '';
    const tls = this.config.REDIS_TLS === 'true' ? 'rediss://' : 'redis://';
    return `${tls}${password}${this.config.REDIS_HOST}:${this.config.REDIS_PORT}`;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return Buffer.from(crypto.randomBytes(32)).toString('hex');
  }

  /**
   * Encrypt sensitive value
   */
  encrypt(value: string): string {
    const crypto = require('crypto');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive value
   */
  decrypt(encryptedValue: string): string {
    const crypto = require('crypto');
    const parts = encryptedValue.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Mask sensitive value for logging
   */
  mask(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) {
      return '***';
    }
    return value.substring(0, visibleChars) + '***';
  }

  /**
   * Get safe configuration for logging (masks sensitive values)
   */
  getSafeConfig(): Record<string, string> {
    return {
      NODE_ENV: this.config.NODE_ENV,
      PORT: this.config.PORT,
      DB_HOST: this.config.DB_HOST,
      DB_PORT: this.config.DB_PORT,
      DB_NAME: this.config.DB_NAME,
      DB_USER: this.mask(this.config.DB_USER),
      DB_PASSWORD: this.mask(this.config.DB_PASSWORD),
      REDIS_HOST: this.config.REDIS_HOST,
      REDIS_PORT: this.config.REDIS_PORT,
      JWT_ACCESS_SECRET: this.mask(this.config.JWT_ACCESS_SECRET),
      JWT_REFRESH_SECRET: this.mask(this.config.JWT_REFRESH_SECRET),
      OPENAI_API_KEY: this.config.OPENAI_API_KEY ? this.mask(this.config.OPENAI_API_KEY) : 'not set',
      GEMINI_API_KEY: this.config.GEMINI_API_KEY ? this.mask(this.config.GEMINI_API_KEY) : 'not set',
      SESSION_SECRET: this.mask(this.config.SESSION_SECRET),
      ENCRYPTION_KEY: this.mask(this.config.ENCRYPTION_KEY),
    };
  }
}

/**
 * Environment-specific configuration
 */
export class EnvConfig {
  private static instance: SecureEnvManager;

  static getInstance(): SecureEnvManager {
    if (!this.instance) {
      this.instance = new SecureEnvManager();
    }
    return this.instance;
  }

  static validate(): void {
    EnvValidator.validate();
  }

  static get(key: keyof z.infer<typeof envSchema>): string {
    return this.getInstance().get(key);
  }

  static isProduction(): boolean {
    return this.getInstance().isProduction();
  }

  static isDevelopment(): boolean {
    return this.getInstance().isDevelopment();
  }

  static isStaging(): boolean {
    return this.getInstance().isStaging();
  }

  static getDatabaseURL(): string {
    return this.getInstance().getDatabaseURL();
  }

  static getRedisURL(): string {
    return this.getInstance().getRedisURL();
  }
}

/**
 * Environment variable validation middleware
 */
export const validateEnv = (req: any, res: any, next: any) => {
  try {
    EnvConfig.validate();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Invalid environment configuration',
      },
    });
  }
};

/**
 * Export default environment configuration
 */
export const config = EnvConfig.getInstance();

/**
 * Export environment configuration utilities
 */
export const envSecurity = {
  validator: EnvValidator,
  manager: SecureEnvManager,
  config: EnvConfig,
  middleware: validateEnv,
};
