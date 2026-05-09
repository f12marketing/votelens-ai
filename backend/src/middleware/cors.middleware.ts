import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * Enterprise-grade CORS Protection
 * Configurable CORS with origin whitelisting, credential support, and security headers
 */

interface CORSConfig {
  origin: string | string[] | RegExp | ((origin: string) => boolean);
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  optionsSuccessStatus?: number;
}

/**
 * Default CORS configuration for development
 */
const DEV_CORS_CONFIG: CORSConfig = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Production CORS configuration
 */
const PROD_CORS_CONFIG: CORSConfig = {
  origin: [
    'https://votelens.ai',
    'https://www.votelens.ai',
    'https://app.votelens.ai',
    'https://admin.votelens.ai',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

/**
 * Custom origin validator function
 */
const originValidator = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || PROD_CORS_CONFIG.origin as string[];
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Check if origin is in allowed list
  const isAllowed = allowedOrigins.includes(origin);
  
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error('Origin not allowed by CORS policy'));
  }
};

/**
 * Dynamic CORS configuration based on environment
 */
export const getCORSConfig = (): CORSConfig => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    return PROD_CORS_CONFIG;
  }
  
  return DEV_CORS_CONFIG;
};

/**
 * CORS middleware factory
 */
export const createCORSMiddleware = (config?: CORSConfig) => {
  const corsConfig = config || getCORSConfig();
  
  return cors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    maxAge: corsConfig.maxAge,
    optionsSuccessStatus: corsConfig.optionsSuccessStatus,
  });
};

/**
 * Strict CORS middleware for production
 * Only allows whitelisted origins
 */
export const strictCORSMiddleware = cors({
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

/**
 * Permissive CORS middleware for development
 */
export const permissiveCORSMiddleware = cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
});

/**
 * CORS middleware with preflight handling
 */
export const corsWithPreflight = (req: Request, res: Response, next: NextFunction) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(204);
    return;
  }
  
  // Apply CORS to all other requests
  next();
};

/**
 * Origin validation middleware
 * Validates the Origin header against whitelist
 */
export const validateOrigin = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (!origin) {
      // Allow requests without Origin header (like mobile apps)
      return next();
    }
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      return next();
    }
    
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_ORIGIN',
        message: 'Origin not allowed',
      },
    });
  };
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message.includes('CORS')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request blocked',
      },
    });
    return;
  }
  next(err);
};

/**
 * CORS logging middleware
 * Logs CORS requests for monitoring
 */
export const corsLogger = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const method = req.method;
  
  if (origin) {
    console.log(`CORS Request: ${method} from ${origin}`);
  }
  
  next();
};

/**
 * Export default CORS middleware based on environment
 */
export const corsMiddleware = createCORSMiddleware();

/**
 * Export specific CORS configurations
 */
export const corsConfigs = {
  development: DEV_CORS_CONFIG,
  production: PROD_CORS_CONFIG,
  strict: strictCORSMiddleware,
  permissive: permissiveCORSMiddleware,
};
