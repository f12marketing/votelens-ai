# VoteLens AI - Security Best Practices

## Overview

This document provides comprehensive security best practices for VoteLens AI, covering implementation guidelines, operational procedures, and compliance requirements.

## Quick Start

### Installation

```bash
# Install required security dependencies
npm install express-rate-limit helmet cors multer ioredis jsonwebtoken
npm install @types/express @types/jsonwebtoken @types/multer --save-dev
npm install zod dotenv
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Environment
NODE_ENV=production

# Server
PORT=5000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votelens
DB_USER=votelens_user
DB_PASSWORD=your_secure_password
DB_SSL=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TLS=true

# JWT
JWT_ACCESS_SECRET=your_32_char_access_secret_key
JWT_REFRESH_SECRET=your_32_char_refresh_secret_key

# Security
SESSION_SECRET=your_32_char_session_secret
ENCRYPTION_KEY=your_32_char_encryption_key

# CORS
ALLOWED_ORIGINS=https://votelens.ai,https://www.votelens.ai
```

### Integration

```typescript
import express from 'express';
import { applySecurityMiddleware, applyAuthentication } from './config/security.config';
import { getSecurityConfig } from './config/security.config';
import { Redis } from 'ioredis';

const app = express();
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true',
});

// Apply security middleware
const securityConfig = getSecurityConfig();
applySecurityMiddleware(app, { ...securityConfig, redis });

// Apply authentication to protected routes
applyAuthentication(app, redis);

app.listen(5000);
```

## Security Middleware

### 1. Rate Limiting

**Purpose**: Prevent abuse and DDoS attacks

**Configuration**:
```typescript
import { createApiRateLimiter, authRateLimiter } from './middleware/rate-limit.middleware';

// API rate limiter with Redis
const apiLimiter = createApiRateLimiter(redis);
app.use('/api', apiLimiter);

// Auth endpoints (strict)
app.use('/api/auth', authRateLimiter);
```

**Best Practices**:
- Use Redis for distributed rate limiting in production
- Implement role-based rate limits (higher for admins)
- Monitor rate limit violations
- Implement adaptive rate limiting based on system load

### 2. CORS Protection

**Purpose**: Control cross-origin requests

**Configuration**:
```typescript
import { strictCORSMiddleware } from './middleware/cors.middleware';

// Production CORS
app.use(strictCORSMiddleware);
```

**Best Practices**:
- Whitelist specific origins in production
- Use strict CORS for production APIs
- Allow credentials only when necessary
- Implement CORS preflight caching

### 3. Security Headers (Helmet)

**Purpose**: Set security HTTP headers

**Configuration**:
```typescript
import { productionHelmet } from './middleware/helmet.middleware';

app.use(productionHelmet);
```

**Headers Set**:
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 4. SQL Injection Protection

**Purpose**: Prevent SQL injection attacks

**Configuration**:
```typescript
import { validateSQLInput, SafeQuery } from './middleware/sql-injection.middleware';

app.use(validateSQLInput);

// Use safe query builder
const result = await SafeQuery.safeFind(User, options);
```

**Best Practices**:
- Always use parameterized queries
- Never concatenate user input into SQL
- Use ORM with proper escaping
- Validate and sanitize all inputs

### 5. XSS Protection

**Purpose**: Prevent cross-site scripting attacks

**Configuration**:
```typescript
import { validateXSSInput, sanitizeXSSInput } from './middleware/xss.middleware';

app.use(validateXSSInput);
app.use(sanitizeXSSInput);
```

**Best Practices**:
- Sanitize all user inputs
- Encode output for HTML, JavaScript, and URLs
- Implement Content Security Policy (CSP)
- Use DOMPurify for HTML sanitization

### 6. Secure File Uploads

**Purpose**: Prevent malicious file uploads

**Configuration**:
```typescript
import { secureUploadChain } from './middleware/secure-upload.middleware';

app.use('/api/uploads', ...secureUploadChain);
```

**Best Practices**:
- Validate file types using magic numbers
- Limit file sizes
- Sanitize filenames
- Scan uploads for viruses
- Store files outside web root

### 7. JWT Authentication

**Purpose**: Secure authentication and authorization

**Configuration**:
```typescript
import { authenticate, getJWTManager } from './middleware/jwt.middleware';

const jwtManager = getJWTManager(redis);
app.use('/api/protected', authenticate(jwtManager));
```

**Best Practices**:
- Use short-lived access tokens (15 min)
- Implement refresh token rotation
- Revoke tokens on logout
- Use secure token storage (HttpOnly cookies)
- Implement token blacklisting

## Environment Variable Security

### Validation

```typescript
import { EnvConfig } from './config/env.security';

// Validate environment variables on startup
EnvConfig.validate();
```

### Best Practices

- Never commit `.env` files to version control
- Use strong secrets (32+ characters)
- Rotate secrets regularly
- Use secret management in production (AWS Secrets Manager, HashiCorp Vault)
- Encrypt sensitive values at rest

## Database Security

### Connection Security

```typescript
// Use SSL/TLS for database connections
const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${db}?sslmode=require`;
```

### Best Practices

- Enable SSL/TLS for all database connections
- Use connection pooling
- Implement least privilege for database users
- Regularly rotate database credentials
- Enable query logging for audit trails

## API Security

### Authentication Flow

1. User logs in with credentials
2. Server validates credentials
3. Server generates access token (15 min) and refresh token (7 days)
4. Client stores tokens securely
5. Client includes access token in Authorization header
6. Server validates token on each request
7. Client uses refresh token to get new access token

### Best Practices

- Always use HTTPS in production
- Implement token expiration
- Use secure cookie attributes (HttpOnly, Secure, SameSite)
- Implement multi-factor authentication for sensitive operations
- Log all authentication attempts

## Monitoring and Logging

### Security Events to Monitor

- Failed login attempts
- Rate limit violations
- SQL injection attempts
- XSS attempts
- Suspicious file uploads
- Token revocations
- Permission denials

### Logging Best Practices

- Log security events with timestamps
- Include IP addresses and user IDs
- Mask sensitive data in logs
- Use structured logging (JSON)
- Send logs to centralized logging service
- Implement log retention policies

## Incident Response

### Security Incident Response Plan

1. **Detection**
   - Automated monitoring alerts
   - User reports
   - Security scans

2. **Containment**
   - Isolate affected systems
   - Block malicious IPs
   - Revoke compromised tokens

3. **Eradication**
   - Remove threats
   - Patch vulnerabilities
   - Update security rules

4. **Recovery**
   - Restore from backups
   - Verify systems
   - Monitor for recurrence

5. **Lessons Learned**
   - Document incident
   - Update procedures
   - Train team

## Compliance

### GDPR Compliance

- Implement data minimization
- Provide data export capability
- Implement data deletion (right to be forgotten)
- Obtain explicit consent
- Report data breaches within 72 hours

### SOC 2 Compliance

- Implement security controls
- Document procedures
- Regular audits
- Access controls
- Change management

## Deployment Security

### Production Deployment Checklist

- [ ] Enable all security middleware
- [ ] Use environment-specific configurations
- [ ] Enable SSL/TLS for all connections
- [ ] Configure rate limiting with Redis
- [ ] Enable security headers
- [ ] Implement CSP
- [ ] Configure CORS whitelist
- [ ] Enable database SSL
- [ ] Rotate all secrets
- [ ] Enable audit logging
- [ ] Configure monitoring alerts
- [ ] Implement backup encryption
- [ ] Enable firewall rules
- [ ] Configure WAF
- [ ] Implement DDoS protection

### CI/CD Security

- Scan dependencies for vulnerabilities
- Run security tests in pipeline
- Sign artifacts
- Implement branch protection
- Require code reviews for security changes
- Use infrastructure as code with security checks

## Testing

### Security Testing

**Unit Tests**:
- Test input validation
- Test sanitization functions
- Test token generation and validation

**Integration Tests**:
- Test authentication flow
- Test rate limiting
- Test file upload validation

**Penetration Testing**:
- SQL injection testing
- XSS testing
- CSRF testing
- Authentication bypass testing

**Security Scanning**:
- OWASP ZAP
- Snyk dependency scanning
- SonarQube code analysis
- Burp Suite penetration testing

## Maintenance

### Regular Tasks

- **Daily**: Review security alerts
- **Weekly**: Review audit logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Penetration testing

### Dependency Management

- Regularly update dependencies
- Monitor for security advisories
- Use npm audit
- Implement automated dependency scanning
- Test updates before deployment

## Common Security Issues and Solutions

### Issue: SQL Injection

**Solution**: Use parameterized queries and ORM
```typescript
// Bad
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Good
const result = await User.findOne({ where: { id: userId } });
```

### Issue: XSS Attack

**Solution**: Sanitize and encode output
```typescript
import { XSSSanitizer } from './middleware/xss.middleware';

const sanitized = XSSSanitizer.sanitizeHTML(userInput);
```

### Issue: Weak Authentication

**Solution**: Use JWT with refresh tokens
```typescript
const tokens = jwtManager.generateTokenPair(payload);
```

### Issue: File Upload Vulnerabilities

**Solution**: Validate file type and content
```typescript
import { SecureUploadValidator } from './middleware/secure-upload.middleware';

const validation = SecureUploadValidator.validateMagicNumber(buffer, mimeType);
```

## Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

### Tools
- [OWASP ZAP](https://www.zaproxy.org/)
- [Snyk](https://snyk.io/)
- [SonarQube](https://www.sonarqube.org/)
- [Burp Suite](https://portswigger.net/burp)

### Standards
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/standard/27001)
- [PCI DSS](https://www.pcisecuritystandards.org/)

## Support

For security issues or questions:
- Review security architecture document
- Check audit logs
- Contact security team
- Create security ticket

## Changelog

### Version 1.0.0 (2026-05-09)
- Initial security implementation
- Rate limiting with Redis support
- CORS protection
- Helmet.js security headers
- SQL injection protection
- XSS protection
- Secure file uploads
- JWT authentication
- Environment variable security
- Production security configurations
