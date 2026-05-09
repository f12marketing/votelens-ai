import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Enterprise-grade XSS Protection
 * Input sanitization, output encoding, and CSP integration
 */

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /on\w+\s*=/gi,
  // Javascript: protocol
  /javascript:/gi,
  // Data URLs with scripts
  /data:.*\/.*;base64/gi,
  // Expression
  /expression\s*\(/gi,
  // vbscript:
  /vbscript:/gi,
  // Flash objects
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  // Embed tags
  /<embed\b[^>]*>/gi,
  // Iframe tags
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  // Meta refresh
  /<meta\s+http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
  // Form action with javascript
  /<form[^>]*action\s*=\s*["']?javascript:/gi,
];

/**
 * Dangerous HTML tags
 */
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'link',
  'meta',
  'style',
  'base',
];

/**
 * Dangerous HTML attributes
 */
const DANGEROUS_ATTRIBUTES = [
  'onload',
  'onerror',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onreset',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onmousedown',
  'onmouseup',
  'onmousemove',
  'ondblclick',
  'oncontextmenu',
  'ondrag',
  'ondrop',
  'oncopy',
  'oncut',
  'onpaste',
  'onbeforeunload',
  'onunload',
  'onresize',
  'onscroll',
  'onanimationstart',
  'onanimationend',
  'onanimationiteration',
  'ontransitionstart',
  'ontransitionend',
  'ontouchstart',
  'ontouchend',
  'ontouchmove',
];

/**
 * XSS Sanitizer class
 */
export class XSSSanitizer {
  /**
   * Sanitize HTML input using DOMPurify
   */
  static sanitizeHTML(input: string, allowedTags?: string[]): string {
    if (typeof input !== 'string') {
      return input;
    }

    const config: any = {
      ALLOWED_TAGS: allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: DANGEROUS_TAGS,
      FORBID_ATTR: DANGEROUS_ATTRIBUTES,
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize URL to prevent javascript: protocol
   */
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') {
      return url;
    }

    // Remove javascript: protocol
    const sanitized = url.replace(/^javascript:/i, '');

    // Remove data: URLs (except for images)
    if (sanitized.startsWith('data:') && !sanitized.startsWith('data:image/')) {
      return '';
    }

    // Remove vbscript: protocol
    return sanitized.replace(/^vbscript:/i, '');
  }

  /**
   * Sanitize CSS to prevent expression()
   */
  static sanitizeCSS(css: string): string {
    if (typeof css !== 'string') {
      return css;
    }

    // Remove expression()
    return css.replace(/expression\s*\(/gi, '');
  }

  /**
   * Encode HTML entities
   */
  static encodeHTML(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Encode URL parameters
   */
  static encodeURL(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    return encodeURIComponent(input);
  }

  /**
   * Encode JavaScript string
   */
  static encodeJS(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\v/g, '\\v');
  }

  /**
   * Detect XSS patterns
   */
  static detectXSS(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any, context: 'html' | 'url' | 'js' = 'html'): any {
    if (typeof obj === 'string') {
      switch (context) {
        case 'html':
          return this.sanitizeHTML(obj);
        case 'url':
          return this.sanitizeURL(obj);
        case 'js':
          return this.encodeJS(obj);
        default:
          return this.encodeHTML(obj);
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, context));
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value, context);
      }
      return sanitized;
    }
    return obj;
  }
}

/**
 * XSS validation middleware
 */
export const validateXSSInput = (req: Request, res: Response, next: NextFunction) => {
  const checkInput = (value: any, path: string = ''): boolean => {
    if (typeof value === 'string') {
      if (XSSSanitizer.detectXSS(value)) {
        console.warn(`XSS attempt detected at ${path}: ${value}`);
        return false;
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (!checkInput(value[i], `${path}[${i}]`)) {
          return false;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (!checkInput(val, `${path}.${key}`)) {
          return false;
        }
      }
    }
    return true;
  };

  // Check request body
  if (req.body && !checkInput(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'XSS_DETECTED',
        message: 'XSS attack detected in input',
      },
    });
  }

  // Check query parameters
  if (req.query && !checkInput(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'XSS_DETECTED',
        message: 'XSS attack detected in query parameters',
      },
    });
  }

  // Check route parameters
  if (req.params && !checkInput(req.params, 'params')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'XSS_DETECTED',
        message: 'XSS attack detected in route parameters',
      },
    });
  }

  next();
};

/**
 * XSS sanitization middleware
 * Automatically sanitizes input data
 */
export const sanitizeXSSInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = XSSSanitizer.sanitizeObject(req.body, 'html');
  }

  if (req.query) {
    req.query = XSSSanitizer.sanitizeObject(req.query, 'url');
  }

  if (req.params) {
    req.params = XSSSanitizer.sanitizeObject(req.params, 'url');
  }

  next();
};

/**
 * Output encoding middleware
 * Encodes response data to prevent reflected XSS
 */
export const encodeXSSOutput = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (typeof data === 'string') {
      // Encode HTML entities in string responses
      const encoded = XSSSanitizer.encodeHTML(data);
      return originalSend.call(this, encoded);
    } else if (data && typeof data === 'object') {
      // Sanitize object responses
      const sanitized = XSSSanitizer.sanitizeObject(data, 'html');
      return originalSend.call(this, sanitized);
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Content-Type validation middleware
 * Ensures responses have proper Content-Type headers
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Set Content-Type if not already set
    if (!res.getHeader('Content-Type')) {
      if (typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json');
      } else {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * XSS logging middleware
 */
export const logXSSAttempts = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (res.statusCode === 400) {
      try {
        const body = typeof data === 'string' ? JSON.parse(data) : data;
        if (body.error?.code === 'XSS_DETECTED') {
          console.error('XSS attack attempt blocked:', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * CSP report handler middleware
 */
export const handleCSPReport = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/security/csp-report' && req.method === 'POST') {
    const report = req.body;
    console.error('CSP violation report:', {
      'csp-report': report['csp-report'],
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
    return res.status(204).end();
  }
  next();
};

/**
 * XSS protection response headers
 */
export const addXSSHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * Export all XSS protection utilities
 */
export const xssProtection = {
  sanitizer: XSSSanitizer,
  middleware: {
    validate: validateXSSInput,
    sanitize: sanitizeXSSInput,
    encode: encodeXSSOutput,
    log: logXSSAttempts,
    csp: handleCSPReport,
    headers: addXSSHeaders,
    contentType: validateContentType,
  },
};
