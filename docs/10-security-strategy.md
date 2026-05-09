# Security Strategy

## Security Principles

### Defense in Depth

```
Security Layers:
1. Network Security: Firewall, DDoS protection
2. Application Security: Authentication, authorization
3. Data Security: Encryption at rest and in transit
4. Infrastructure Security: Secure configurations
5. Monitoring: Intrusion detection, logging
```

### Least Privilege

```
Access Control:
- Users: Minimum required permissions
- Services: Principle of least privilege
- Database: Read-only where possible
- API: Scoped access tokens
```

## Authentication Security

### Token Security

```typescript
// JWT token configuration
const jwtConfig = {
  accessToken: {
    expiresIn: '1h',
    algorithm: 'RS256',
    issuer: 'votelens.ai',
    audience: 'api.votelens.ai',
  },
  refreshToken: {
    expiresIn: '7d',
    algorithm: 'RS256',
    issuer: 'votelens.ai',
    audience: 'api.votelens.ai',
  },
};

// Token validation
function validateToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'votelens.ai',
      audience: 'api.votelens.ai',
    });
    return true;
  } catch (error) {
    return false;
  }
}
```

### Session Security

```typescript
// Secure session configuration
const sessionConfig = {
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
    domain: '.votelens.ai',
  },
  rolling: true,
  resave: false,
  saveUninitialized: false,
};
```

### Password Security

```typescript
// Password requirements
const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true,
};

// Password validation
function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

## API Security

### Rate Limiting

```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    });
  },
});

// Different limits for different endpoints
const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
});

const queryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 queries per hour
});
```

### Input Validation

```typescript
// Zod validation schemas
import { z } from 'zod';

const createElectionSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  electionType: z.enum(['GENERAL', 'STATE', 'LOCAL', 'BY_ELECTION', 'REFERENDUM']),
  date: z.coerce.date(),
  country: z.string().min(2).max(2),
  region: z.string().max(255).optional(),
  totalSeats: z.number().int().min(1),
});

// Validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors,
        },
      });
    }
  };
};
```

### SQL Injection Prevention

```typescript
// Use parameterized queries (Prisma handles this automatically)
const election = await prisma.election.findUnique({
  where: { id: electionId },
});

// Never concatenate user input into queries
// BAD:
const query = `SELECT * FROM elections WHERE id = '${userInput}'`;

// GOOD:
const election = await prisma.election.findUnique({
  where: { id: userInput },
});
```

### XSS Prevention

```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

// React automatically escapes JSX
// For dangerouslySetInnerHTML, always sanitize:
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

## Data Security

### Encryption at Rest

```typescript
// Database encryption
const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  authTagLength: 16,
};

// Encrypt sensitive data
function encryptSensitiveData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    encryptionConfig.algorithm,
    encryptionKey,
    iv
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data
function decryptSensitiveData(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(
    encryptionConfig.algorithm,
    encryptionKey,
    iv
  );
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Encryption in Transit

```typescript
// HTTPS configuration
const httpsConfig = {
  protocol: 'https',
  tlsVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ],
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
};

// Force HTTPS in Express
app.use((req, res, next) => {
  if (req.protocol !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### Data Masking

```typescript
// Mask sensitive data in logs
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
}

function maskPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskCardNumber(card: string): string {
  return card.replace(/\d(?=\d{4})/g, '*');
}
```

## Network Security

### CORS Configuration

```typescript
// CORS middleware
const corsConfig = {
  origin: [
    'https://votelens.ai',
    'https://www.votelens.ai',
    'https://app.votelens.ai',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

app.use(cors(corsConfig));
```

### Security Headers

```typescript
// Security headers middleware
app.use(helmet());

// Custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  next();
});
```

### DDoS Protection

```
DDoS Mitigation Strategy:
1. Cloudflare DDoS protection (free tier)
2. Rate limiting per IP
3. Request queuing
4. Automatic IP blocking
5. CAPTCHA for suspicious requests

Configuration:
- Rate limit: 1000 req/min per IP
- Block duration: 1 hour
- CAPTCHA threshold: 500 req/min
```

## Infrastructure Security

### Container Security

```dockerfile
# Use minimal base image
FROM node:20-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Minimal permissions
COPY --chown=nodejs:nodejs . .
```

### Dependency Security

```json
// package.json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "snyk": "snyk test",
    "snyk:monitor": "snyk monitor"
  },
  "devDependencies": {
    "snyk": "^1.1000.0"
  }
}
```

### Environment Variable Security

```typescript
// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'GOOGLE_CLOUD_PROJECT',
];

function validateEnvVars(): void {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Never log environment variables
logger.info('Application started'); // Safe
logger.info(`Database: ${process.env.DATABASE_URL}`); // UNSAFE
```

## Monitoring & Logging

### Security Logging

```typescript
// Security event logger
class SecurityLogger {
  static logAuthenticationEvent(event: AuthEvent): void {
    logger.info('Authentication event', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      timestamp: new Date(),
    });
  }

  static logAuthorizationEvent(event: AuthzEvent): void {
    logger.info('Authorization event', {
      type: event.type,
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      allowed: event.allowed,
      ip: event.ip,
      timestamp: new Date(),
    });
  }

  static logSecurityIncident(incident: SecurityIncident): void {
    logger.error('Security incident', {
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      ip: incident.ip,
      userId: incident.userId,
      timestamp: new Date(),
    });
  }
}
```

### Intrusion Detection

```typescript
// Anomaly detection
class AnomalyDetector {
  static detectSuspiciousActivity(userId: string): boolean {
    const recentAttempts = this.getRecentLoginAttempts(userId, 15); // 15 minutes
    
    // Multiple failed attempts
    if (recentAttempts.filter(a => !a.success).length > 5) {
      return true;
    }
    
    // Attempts from multiple locations
    const uniqueIPs = new Set(recentAttempts.map(a => a.ip));
    if (uniqueIPs.size > 3) {
      return true;
    }
    
    // Rapid attempts
    if (recentAttempts.length > 20) {
      return true;
    }
    
    return false;
  }

  static detectAbnormalAPIUsage(userId: string): boolean {
    const requests = this.getRecentAPIRequests(userId, 60); // 1 minute
    
    // Rate limit exceeded
    if (requests.length > 1000) {
      return true;
    }
    
    // Unusual endpoints
    const unusualEndpoints = requests.filter(r => 
      !this.isCommonEndpoint(r.endpoint)
    );
    if (unusualEndpoints.length > 10) {
      return true;
    }
    
    return false;
  }
}
```

## Compliance

### GDPR Compliance

```
Data Subject Rights:
1. Right to access: Users can request their data
2. Right to rectification: Users can correct their data
3. Right to erasure: Users can delete their data
4. Right to portability: Users can export their data
5. Right to object: Users can object to processing

Implementation:
- Data export endpoint
- Data deletion endpoint
- Consent management
- Data processing records
```

### Data Retention

```typescript
// Data retention policy
const retentionPolicy = {
  userAccounts: {
    active: 'indefinite',
    deleted: '30 days',
  },
  auditLogs: {
    access: '90 days',
    security: '1 year',
  },
  queryHistory: {
    user: '30 days',
    aggregate: '1 year',
  },
  insights: {
    approved: 'indefinite',
    rejected: '90 days',
  },
};

// Automatic data deletion
async function enforceRetentionPolicy(): Promise<void> {
  // Delete old audit logs
  await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Delete old query history
  await prisma.queryHistory.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
}
```

## Security Testing

### Penetration Testing

```
Testing Schedule:
- External penetration test: Quarterly
- Internal security audit: Monthly
- Dependency vulnerability scan: Weekly
- Automated security testing: Continuous

Testing Scope:
- Authentication flows
- Authorization checks
- Input validation
- API security
- Data encryption
- Session management
```

### Security Checklist

```
Pre-Deployment Checklist:
- [ ] All dependencies up to date
- [ ] No known vulnerabilities
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Logging configured
- [ ] Monitoring configured
- [ ] Backup strategy verified
- [ ] Disaster recovery tested
```

## Incident Response

### Incident Response Plan

```
Severity Levels:
1. Critical: Immediate response required (<15 min)
2. High: Response within 1 hour
3. Medium: Response within 4 hours
4. Low: Response within 24 hours

Response Steps:
1. Detection: Identify the incident
2. Containment: Limit the damage
3. Eradication: Remove the threat
4. Recovery: Restore normal operations
5. Lessons learned: Document and improve

Communication:
- Internal: Security team, management
- External: Users (if affected), authorities (if required)
- Timeline: Within 24 hours for critical incidents
```

### Security Incident Template

```typescript
interface SecurityIncident {
  id: string;
  type: 'data_breach' | 'unauthorized_access' | 'ddos' | 'malware' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedSystems: string[];
  affectedUsers: string[];
  timeline: IncidentEvent[];
  containmentActions: string[];
  recoveryActions: string[];
  lessonsLearned: string[];
  createdAt: Date;
  resolvedAt?: Date;
}
```
