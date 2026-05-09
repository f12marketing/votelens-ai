# VoteLens AI - Railway Deployment Guide

## Architecture Overview

VoteLens AI will be deployed on Railway using a monorepo strategy with three distinct services:

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Project                          │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐│
│  │   Frontend   │      │   Backend    │      │  PostgreSQL  ││
│  │   (Vite)     │◄────►│   (Node.js)  │◄────►│   (Railway)  ││
│  │   Service    │      │   Service    │      │   Database   ││
│  └──────────────┘      └──────────────┘      └──────────────┘│
│         │                    │                     │           │
│         ▼                    ▼                     ▼           │
│   Static Assets        API Endpoints          Data Store    │
│   (CDN)                (Auto-scaling)        (Managed)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Service Separation Strategy

### 1. Frontend Service
- **Runtime**: Node.js 18+
- **Framework**: Vite + React
- **Build**: Static files
- **Deployment**: Railway Static Site
- **Domain**: `vote-lens-ai.railway.app` (or custom domain)
- **Port**: Not applicable (static site)

### 2. Backend Service
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Type**: API Service
- **Deployment**: Railway Service
- **Domain**: `api.vote-lens-ai.railway.app` (or custom domain)
- **Port**: 3000

### 3. PostgreSQL Database
- **Type**: Managed PostgreSQL
- **Version**: PostgreSQL 15+
- **Deployment**: Railway PostgreSQL
- **Region**: Same as services for low latency
- **Backups**: Automatic daily backups

## Railway Project Structure

```
vote-lens-ai (Railway Project)
├── vote-lens-ai-frontend (Service)
│   ├── Source: ./frontend
│   ├── Build Command: cd frontend && npm run build
│   ├── Output Directory: frontend/dist
│   └── Environment Variables: VITE_API_URL, VITE_APP_URL
│
├── vote-lens-ai-backend (Service)
│   ├── Source: ./backend
│   ├── Build Command: cd backend && npm run build
│   ├── Start Command: cd backend && npm run start:prod
│   ├── Port: 3000
│   └── Environment Variables: DATABASE_URL, JWT_SECRET, etc.
│
└── vote-lens-ai-db (Database)
    ├── Type: PostgreSQL
    └── Variables: DATABASE_URL
```

## Deployment Topology

### Network Architecture

1. **Public Internet**
   - HTTPS requests → Railway Load Balancer
   - Custom domains via Railway DNS

2. **Frontend Layer**
   - Serves static assets via Railway CDN
   - Proxies API calls to backend service
   - Automatic SSL/TLS termination

3. **Backend Layer**
   - Receives API requests from frontend
   - Auto-scales based on traffic
   - Connects to PostgreSQL via private network
   - Rate limiting and caching

4. **Database Layer**
   - Private network access only
   - Automatic backups and point-in-time recovery
   - Connection pooling

### Service Communication

- **Frontend → Backend**: HTTP/HTTPS via public URLs
- **Backend → Database**: Private Railway network
- **Backend → External APIs**: HTTPS (AI services, etc.)

## Environment Setup

### Development Environment Variables

Create `.env.development`:

```bash
# Frontend
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_URL=http://localhost:5173

# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/votelens_dev
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gemini-pro

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE=10485760

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### Production Environment Variables

Configure in Railway dashboard:

**Frontend Service:**
```bash
VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
VITE_APP_URL=https://vote-lens-ai.railway.app
```

**Backend Service:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{DATABASE_URL}}
JWT_SECRET=${{JWT_SECRET}}
JWT_EXPIRES_IN=7d
REDIS_URL=${{REDIS_URL}}

# AI Services
GEMINI_API_KEY=${{GEMINI_API_KEY}}
OPENAI_API_KEY=${{OPENAI_API_KEY}}
AI_MODEL=gemini-pro

# CORS
CORS_ORIGIN=https://vote-lens-ai.railway.app

# Upload
UPLOAD_DIR=/tmp/uploads
UPLOAD_MAX_SIZE=10485760

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json

# Railway-specific
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=backend
```

## Production Build Configurations

### Frontend Build Configuration

Create `frontend/.railway/railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run preview"
healthcheckPath = "/"

[[plugins]]
plugin = "@railway/static"
```

Create `frontend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.build]
cmds = ["cd frontend && npm install", "cd frontend && npm run build"]

[start]
cmd = "cd frontend && npm run preview"

[static]
main = "frontend/dist"
```

### Backend Build Configuration

Create `backend/.railway/railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[plugins]]
plugin = "@railway/node"
```

Create `backend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "postgresql"]

[phases.build]
cmds = ["cd backend && npm install", "cd backend && npm run build"]

[start]
cmd = "cd backend && npm run start:prod"

[variables]
NODE_ENV = "production"
PORT = "3000"
```

## Railway Networking Configuration

### Service Discovery

Railway provides automatic service discovery via environment variables:

- `DATABASE_URL` - Automatically injected from PostgreSQL service
- `REDIS_URL` - Automatically injected from Redis service (if added)
- Service URLs available via Railway's internal DNS

### Custom Domain Configuration

1. **Frontend Domain**
   - Add domain in Railway dashboard
   - Configure DNS: CNAME `vote-lens-ai.yourdomain.com` → `vote-lens-ai-frontend.railway.app`
   - Enable automatic SSL

2. **Backend Domain**
   - Add domain in Railway dashboard
   - Configure DNS: CNAME `api.vote-lens-ai.yourdomain.com` → `vote-lens-ai-backend.railway.app`
   - Enable automatic SSL

### Network Security

- **Database**: Private network only, no public access
- **Backend**: Public access via HTTPS, protected by rate limiting
- **Frontend**: Public access via HTTPS, static files
- **Service-to-Service**: Private Railway network for backend ↔ database

## Scalable Deployment Setup

### Auto-Scaling Configuration

**Backend Service:**
- **Min Instances**: 1
- **Max Instances**: 10
- **CPU**: 0.5 vCPU per instance
- **RAM**: 512MB per instance
- **Scale Up**: When CPU > 70% for 5 minutes
- **Scale Down**: When CPU < 30% for 10 minutes

**Frontend Service:**
- **Type**: Static Site (auto-scaling via CDN)
- **CDN**: Railway's built-in CDN
- **Cache**: Static assets cached at edge locations

### Database Scaling

**PostgreSQL:**
- **Plan**: Start with Standard-0 (512MB RAM, 1 vCPU)
- **Auto-scale**: Upgrade plan based on storage/CPU usage
- **Connection Pooling**: PgBouncer enabled
- **Read Replicas**: Add read replicas for high traffic (optional)

### Redis (Optional)

Add Redis for caching:
- **Plan**: Redis-0 (25MB)
- **Use Cases**: Session storage, caching, rate limiting
- **Persistence**: AOF with 1-second fsync

## Production Deployment Workflow

### Initial Setup

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   railway link
   ```

2. **Create Services**
   ```bash
   # Frontend
   railway add frontend
   railway set frontend

   # Backend
   railway add backend
   railway set backend

   # PostgreSQL
   railway add postgresql
   railway set postgresql
   ```

3. **Configure Environment Variables**
   - Use Railway dashboard or CLI
   - Reference service variables: `${{DATABASE_URL}}`
   - Add secrets via Railway's secret management

4. **Deploy Services**
   ```bash
   railway up
   ```

### CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
        
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Database Migrations

Create migration script:

```bash
# backend/scripts/migrate.ts
import { Client } from 'pg';
import { getConfig } from '../src/config/app.config';

const config = getConfig();
const client = new Client({ connectionString: config.database.url });

async function migrate() {
  await client.connect();
  
  // Run migrations
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await client.end();
  console.log('Migrations completed');
}

migrate().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate.ts",
    "deploy:migrate": "railway run npm run migrate"
  }
}
```

### Health Checks

**Backend Health Check** (already exists):
```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

**Railway Health Check Configuration:**
```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

### Monitoring and Logging

**Railway Metrics:**
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

**Structured Logging:**
```typescript
// Use JSON format in production
logger.info('Request received', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
});
```

### Rollback Strategy

1. **Automatic Rollback**
   - Railway automatically rolls back on failed deployments
   - Keep last 5 deployment versions

2. **Manual Rollback**
   ```bash
   railway rollback
   ```

3. **Database Rollback**
   - Use PostgreSQL point-in-time recovery
   - Backup before major changes

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database schema finalized
- [ ] Migration scripts tested
- [ ] Health checks implemented
- [ ] Error handling standardized
- [ ] Rate limiting configured
- [ ] CORS settings correct
- [ ] SSL certificates ready
- [ ] Custom domains configured
- [ ] Monitoring/alerting set up

### Post-Deployment
- [ ] Verify frontend builds successfully
- [ ] Verify backend starts without errors
- [ ] Test database connectivity
- [ ] Verify API endpoints respond
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify AI service integration
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Test scaling behavior
- [ ] Verify backups are running

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check DATABASE_URL environment variable
- Verify PostgreSQL service is running
- Check network connectivity in Railway dashboard

**2. Frontend Cannot Connect to Backend**
- Verify VITE_API_URL is correct
- Check CORS settings on backend
- Verify backend service is running

**3. Build Failures**
- Check build logs in Railway dashboard
- Verify all dependencies are in package.json
- Ensure build commands are correct

**4. Slow Performance**
- Check resource limits (CPU/RAM)
- Enable Redis caching
- Optimize database queries
- Add CDN for static assets

## Cost Optimization

**Estimated Monthly Costs (Railway):**

- Frontend (Static): $0 (included)
- Backend (Node.js): ~$5-20/month (depending on usage)
- PostgreSQL: ~$5-50/month (depending on plan)
- Redis (optional): ~$5/month
- **Total**: ~$15-75/month

**Optimization Tips:**
1. Use free tier for development
2. Scale based on actual usage
3. Enable caching to reduce database queries
4. Optimize AI API calls with caching
5. Use Railway's free tier for staging

## Security Checklist

- [ ] JWT secrets stored as Railway secrets
- [ ] API keys stored as Railway secrets
- [ ] Database on private network
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Security headers configured
- [ ] Regular automated backups
- [ ] Database connection encryption
- [ ] Environment variable encryption

## Next Steps

1. **Immediate**
   - Set up Railway account and project
   - Configure environment variables
   - Deploy to staging environment
   - Test all functionality

2. **Week 1**
   - Deploy to production
   - Configure custom domains
   - Set up monitoring and alerting
   - Conduct load testing

3. **Week 2**
   - Optimize based on metrics
   - Implement Redis caching
   - Set up CI/CD pipeline
   - Document runbook

## Support Resources

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://github.com/railwayapp/cli
- Railway Community: https://community.railway.app
- Support: support@railway.app
