import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise-grade Security Headers with Helmet.js
 * Implements comprehensive security headers for production
 */

/**
 * Content Security Policy (CSP) configuration
 */
const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  connectSrc: [
    "'self'",
    'https://api.votelens.ai',
    'https://*.googleapis.com',
    'https://*.gstatic.com',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
  frameSrc: ["'none'"],
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  manifestSrc: ["'self'"],
  mediaSrc: ["'self'", 'https:'],
  objectSrc: ["'none'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  workerSrc: ["'self'", 'blob:'],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
};

/**
 * Permissions Policy configuration
 */
const PERMISSIONS_POLICY = {
  'accelerometer': ['none'],
  'ambient-light-sensor': ['none'],
  'autoplay': ['self'],
  'battery': ['none'],
  'camera': ['none'],
  'cross-origin-isolated': ['none'],
  'display-capture': ['none'],
  'document-domain': ['none'],
  'encrypted-media': ['none'],
  'execution-while-not-rendered': ['none'],
  'execution-while-out-of-viewport': ['none'],
  'fullscreen': ['self'],
  'geolocation': ['none'],
  'gyroscope': ['none'],
  'hid': ['none'],
  'identity-credentials-get': ['none'],
  'idle-detection': ['none'],
  'local-fonts': ['none'],
  'magnetometer': ['none'],
  'microphone': ['none'],
  'midi': ['none'],
  'navigation-override': ['none'],
  'payment': ['none'],
  'picture-in-picture': ['self'],
  'publickey-credentials-get': ['none'],
  'screen-wake-lock': ['none'],
  'serial': ['none'],
  'sync-xhr': ['none'],
  'usb': ['none'],
  'web-share': ['none'],
  'xr-spatial-tracking': ['none'],
};

/**
 * HSTS configuration for production
 */
const HSTS_CONFIG = {
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
};

/**
 * Development security headers (relaxed)
 */
export const developmentHelmet = helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

/**
 * Production security headers (strict)
 */
export const productionHelmet = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      ...CSP_DIRECTIVES,
      upgradeInsecureRequests: [],
    },
  },

  // HTTP Strict Transport Security
  hsts: HSTS_CONFIG,

  // Cross-Origin policies
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // Other security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,

  // Permissions Policy
  permissionsPolicy: PERMISSIONS_POLICY,
});

/**
 * Custom security headers middleware
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache control for sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Environment-based Helmet middleware
 */
export const getHelmetMiddleware = () => {
  const environment = process.env.NODE_ENV || 'development';

  if (environment === 'production') {
    return productionHelmet;
  }

  return developmentHelmet;
};

/**
 * Content Security Policy for API endpoints (relaxed)
 */
export const apiCSP = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
});

/**
 * Content Security Policy for web application (strict)
 */
export const webCSP = helmet.contentSecurityPolicy({
  directives: {
    ...CSP_DIRECTIVES,
    reportUri: '/api/security/csp-report',
  },
});

/**
 * HSTS middleware
 */
export const hstsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.protocol === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
};

/**
 * Security header validation middleware
 * Ensures security headers are set correctly
 */
export const validateSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
  ];

  const missingHeaders = requiredHeaders.filter(
    header => !res.getHeader(header)
  );

  if (missingHeaders.length > 0) {
    console.warn(`Missing security headers: ${missingHeaders.join(', ')}`);
  }

  next();
};

/**
 * Remove sensitive headers from responses
 */
export const removeSensitiveHeaders = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Remove sensitive headers before sending
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Export default Helmet middleware
 */
export const helmetMiddleware = getHelmetMiddleware();

/**
 * Export all security middleware
 */
export const securityMiddleware = [
  getHelmetMiddleware(),
  customSecurityHeaders,
  removeSensitiveHeaders,
];

/**
 * Export configurations
 */
export const securityConfigs = {
  csp: CSP_DIRECTIVES,
  permissionsPolicy: PERMISSIONS_POLICY,
  hsts: HSTS_CONFIG,
};
