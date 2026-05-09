# Deployment Architecture

## Frontend Deployment (Vercel)

### Vercel Configuration

```javascript
// vercel.json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": {
      "description": "Backend API URL",
      "value": "https://api.votelens.ai"
    },
    "VITE_FIREBASE_API_KEY": {
      "description": "Firebase API Key",
      "value": "@firebase_api_key"
    },
    "VITE_FIREBASE_AUTH_DOMAIN": {
      "description": "Firebase Auth Domain",
      "value": "@firebase_auth_domain"
    },
    "VITE_FIREBASE_PROJECT_ID": {
      "description": "Firebase Project ID",
      "value": "@firebase_project_id"
    }
  },
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Vercel Deployment Pipeline

```
1. Push to main branch
2. Vercel webhook triggers
3. Install dependencies
4. Run build (npm run build)
5. Run tests (npm run test)
6. Deploy to production
7. Invalidate cache
8. Update DNS
```

## Backend Deployment (Railway)

### Railway Configuration

```yaml
# railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build",
    "watchPaths": ["backend"]
  },
  "deploy": {
    "startCommand": "cd backend && npm run start:prod",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Railway Services

```
Services:
1. Backend API (Node.js)
   - Replicas: 2-10 (auto-scaling)
   - CPU: 0.5-2 vCPU
   - RAM: 512MB-4GB
   - Environment variables

2. PostgreSQL Database
   - Version: PostgreSQL 15
   - Plan: Production-4 ($20/mo)
   - Replicas: 1 (read replica)
   - Backups: Daily + hourly

3. Redis Cache
   - Version: Redis 7
   - Plan: Redis-0 ($5/mo)
   - Max memory: 256MB
   - Persistence: RDB + AOF

4. BullMQ Worker
   - Replicas: 1-5 (auto-scaling)
   - CPU: 0.25-1 vCPU
   - RAM: 256MB-1GB
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run frontend tests
        run: cd frontend && npm run test
      
      - name: Run backend tests
        run: cd backend && npm run test
      
      - name: Run linting
        run: npm run lint

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: railwayapp/cli-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_SERVICE_ID }}
          command: "up"
```

## Infrastructure as Code

### Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: votelens
      POSTGRES_PASSWORD: votelens
      POSTGRES_DB: votelens
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://votelens:votelens@postgres:5432/votelens
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## Monitoring & Observability

### Application Monitoring

```typescript
// src/utils/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'operation'],
  registers: [register],
});

export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['model', 'operation'],
  registers: [register],
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Logging Strategy

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'votelens-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

## CDN & Asset Delivery

```
CDN Strategy:
- Static assets: Vercel Edge Network
- Images: Cloudflare R2 + Cloudflare CDN
- API responses: Railway (no CDN)
- Map tiles: Leaflet default providers

Asset Optimization:
- Images: WebP format, lazy loading
- Fonts: Self-hosted with WOFF2
- CSS: Minified, critical CSS inlined
- JS: Minified, tree-shaken, code-split
```

## Environment Management

### Environment Variables

```bash
# Development (.env.development)
NODE_ENV=development
VITE_API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/votelens_dev
REDIS_URL=redis://localhost:6379

# Staging (.env.staging)
NODE_ENV=staging
VITE_API_URL=https://api-staging.votelens.ai
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Production (.env.production)
NODE_ENV=production
VITE_API_URL=https://api.votelens.ai
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Secret Management

```
Secret Storage:
- Development: .env file (gitignored)
- Staging: Railway Environment Variables
- Production: Railway Environment Variables + Vercel Environment Variables

Secret Rotation:
- API keys: Quarterly
- Database credentials: Semi-annually
- Firebase keys: As needed
- JWT secrets: Annually
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] Backup current production
- [ ] Notify stakeholders

### Post-Deployment

- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify data integrity
- [ ] Update documentation
- [ ] Notify team of success

### Rollback Plan

```
Rollback Triggers:
- Error rate > 5% for 5 minutes
- Response time > 2s for 5 minutes
- Database connection failures
- Critical functionality broken

Rollback Steps:
1. Deploy previous version
2. Restore database if needed
3. Clear cache
4. Verify health checks
5. Monitor metrics
6. Post-mortem analysis
```

## Cost Estimation

### Monthly Costs (Production)

```
Frontend (Vercel):
- Pro Plan: $20/mo
- Bandwidth: Included
- Build minutes: Included

Backend (Railway):
- Backend API: $20/mo (2 replicas)
- PostgreSQL: $20/mo (Production-4)
- Redis: $5/mo (Redis-0)
- Worker: $10/mo (1 replica)
- Total: $55/mo

External Services:
- Firebase: Free tier
- Gemini AI: $0.001/1K tokens
- Cloudflare R2: $0.015/GB storage
- Domain: $12/year

Estimated Total: ~$80/mo
```

## Disaster Recovery

### Backup Strategy

```
Data Backups:
- Database: Daily full + hourly incremental (Railway)
- File storage: Cloudflare R2 with versioning
- Configuration: Git repository

Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour
```

### High Availability

```
Redundancy:
- Frontend: Vercel Edge Network (global)
- Backend: Railway auto-scaling (2+ replicas)
- Database: PostgreSQL with read replica
- Cache: Redis with persistence

Failover:
- Automatic health checks
- Auto-restart on failure
- Load balancer routing
- Graceful degradation
```
