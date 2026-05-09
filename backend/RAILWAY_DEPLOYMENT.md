# VoteLens AI Backend - Railway Deployment Guide

## Overview

This guide covers deploying the VoteLens AI Express.js backend to Railway with production-grade configuration including PostgreSQL integration, CORS configuration, health checks, logging, and scalable API deployment.

## Deployment Strategy

### Option 1: Railway Direct Deployment (Recommended)

Deploy directly from GitHub with Railway's built-in build system:
- Automatic builds on push
- Zero configuration
- Automatic scaling
- Integrated PostgreSQL

### Option 2: Docker Deployment

Deploy using Docker with custom configuration:
- Complete control over runtime
- Custom dependencies
- Advanced configuration
- Reproducible builds

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`
- PostgreSQL database (Railway managed)
- Docker installed (for Option 2)
- Domain name (optional, for custom domains)

## Environment Variables

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# Database
DATABASE_URL=${{DATABASE_URL}}

# JWT Configuration
JWT_SECRET=${{JWT_SECRET}}
JWT_ACCESS_SECRET=${{JWT_ACCESS_SECRET}}
JWT_REFRESH_SECRET=${{JWT_REFRESH_SECRET}}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AI Services
GEMINI_API_KEY=${{GEMINI_API_KEY}}
OPENAI_API_KEY=${{OPENAI_API_KEY}}
AI_MODEL=gemini-pro
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7

# CORS Configuration
CORS_ORIGIN=https://vote-lens-ai.railway.app,https://vote-lens-ai.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_DIR=/tmp/uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=csv,xlsx,xls,json

# Cache Configuration
CACHE_TTL_SECONDS=3600
CACHE_MAX_SIZE=1000

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json

# Database Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Optional Variables

```bash
# Redis (if using Redis for caching)
REDIS_URL=${{REDIS_URL}}

# Railway-specific
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=backend
```

## Option 1: Railway Direct Deployment

### Step 1: Initialize Railway Project

```bash
# Navigate to backend directory
cd backend

# Login to Railway
railway login

# Initialize Railway project
railway init

# Link to existing project if needed
railway link
```

### Step 2: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# Set database name
railway set postgresql --name vote-lens-ai-db
```

Railway will automatically inject `DATABASE_URL` environment variable.

### Step 3: Add Backend Service

```bash
# Add backend service
railway add backend

# Set service name
railway set backend --name vote-lens-ai-backend
```

### Step 4: Configure Environment Variables

```bash
# Set backend service
railway set backend

# Add environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=${{JWT_SECRET}}
railway variables set JWT_ACCESS_SECRET=${{JWT_ACCESS_SECRET}}
railway variables set JWT_REFRESH_SECRET=${{JWT_REFRESH_SECRET}}
railway variables set JWT_EXPIRES_IN=7d
railway variables set JWT_REFRESH_EXPIRES_IN=30d
railway variables set GEMINI_API_KEY=${{GEMINI_API_KEY}}
railway variables set OPENAI_API_KEY=${{OPENAI_API_KEY}}
railway variables set AI_MODEL=gemini-pro
railway variables set CORS_ORIGIN=https://vote-lens-ai.railway.app
railway variables set UPLOAD_DIR=/tmp/uploads
railway variables set UPLOAD_MAX_SIZE=10485760
railway variables set LOG_LEVEL=warn
railway variables set LOG_FORMAT=json
railway variables set DATABASE_POOL_MIN=2
railway variables set DATABASE_POOL_MAX=10

# Reference database URL
railway variables set DATABASE_URL=${{DATABASE_URL}}
```

### Step 5: Deploy Backend

```bash
# Deploy backend
railway up --service backend

# Monitor logs
railway logs --service backend
```

### Step 6: Run Database Migrations

```bash
# Run migrations
railway run --service backend npm run migrate
```

If you don't have a migration script, create one:

```typescript
// backend/scripts/migrate.ts
import { Client } from 'pg';
import { getConfig } from '../src/config/app.config';

const config = getConfig();
const client = new Client({ connectionString: config.database.url });

async function migrate() {
  await client.connect();
  
  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS elections (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      total_voters BIGINT,
      total_votes_cast BIGINT,
      voter_turnout DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await client.end();
  console.log('Migrations completed');
}

migrate().catch(console.error);
```

### Step 7: Verify Deployment

```bash
# Get backend URL
railway domain --service backend

# Check health endpoint
curl https://vote-lens-ai-backend.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-05-09T12:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "rss": 12345678,
    "heapTotal": 9876543,
    "heapUsed": 5432109,
    "external": 123456
  },
  "environment": "production"
}
```

## Option 2: Docker Deployment

### Step 1: Build Docker Image

```bash
# Navigate to backend directory
cd backend

# Build Docker image
docker build -t vote-lens-ai-backend .

# Test locally
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@localhost:5432/votelens \
  -e JWT_SECRET=your-secret \
  vote-lens-ai-backend
```

### Step 2: Push to Docker Registry

```bash
# Tag image
docker tag vote-lens-ai-backend your-registry/vote-lens-ai-backend:latest

# Push to registry
docker push your-registry/vote-lens-ai-backend:latest
```

### Step 3: Deploy to Railway

```bash
# Add service to Railway
railway add backend

# Configure as Docker service
railway set backend --type docker

# Set Docker image
railway variables set DOCKER_IMAGE=your-registry/vote-lens-ai-backend:latest

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set DATABASE_URL=${{DATABASE_URL}}
railway variables set JWT_SECRET=${{JWT_SECRET}}
railway variables set CORS_ORIGIN=https://vote-lens-ai.railway.app

# Deploy
railway up --service backend
```

## CORS Configuration

The CORS configuration in `src/app/app.ts` is production-ready:

```typescript
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
};
```

### Setting CORS Origins

```bash
# Single origin
railway variables set CORS_ORIGIN=https://vote-lens-ai.railway.app

# Multiple origins (comma-separated)
railway variables set CORS_ORIGIN=https://vote-lens-ai.railway.app,https://vote-lens-ai.yourdomain.com
```

## Health Checks

### Health Check Endpoint

Already implemented in `src/app/app.ts`:

```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});
```

### Railway Health Check Configuration

Already configured in `nixpacks.toml`:

```toml
[healthcheck]
path = "/health"
interval = 30
timeout = 10
retries = 3
```

### Docker Health Check

Already configured in `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Logging Configuration

### Structured Logging

The backend uses structured logging with JSON format in production:

```typescript
// Log levels: error, warn, info, debug
logger.info('Request received', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
});
```

### Viewing Logs

```bash
# View real-time logs
railway logs --service backend

# View last 100 lines
railway logs --service backend --lines 100

# View logs for specific time range
railway logs --service backend --since 1h
```

## PostgreSQL Integration

### Database Connection

Railway automatically provides `DATABASE_URL`:

```bash
# Reference database URL
railway variables set DATABASE_URL=${{DATABASE_URL}}
```

### Connection Pooling

Configure connection pool settings:

```bash
railway variables set DATABASE_POOL_MIN=2
railway variables set DATABASE_POOL_MAX=10
```

### Database Backups

Railway automatically creates daily backups. Configure in Railway Dashboard:
- Go to PostgreSQL service
- Click "Settings" → "Backups"
- Configure retention period (default: 7 days)
- Enable point-in-time recovery

## Custom Domain Configuration

### Step 1: Add Domain in Railway

1. Go to Railway Dashboard
2. Select `vote-lens-ai-backend` service
3. Click "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `api.vote-lens-ai.yourdomain.com`
6. Click "Add Domain"

### Step 2: Configure DNS

Add CNAME record in your DNS provider:

```
Type: CNAME
Name: api
Value: vote-lens-ai-backend.railway.app
TTL: 300
```

### Step 3: Update CORS Configuration

```bash
railway variables set CORS_ORIGIN=https://vote-lens-ai.yourdomain.com
```

### Step 4: Redeploy

```bash
railway up --service backend
```

## Scaling Configuration

### Auto-Scaling

Via Railway Dashboard:
1. Go to `vote-lens-ai-backend` service
2. Click "Settings" → "Scaling"
3. Configure:
   - Min Instances: 1
   - Max Instances: 10
   - CPU: 0.5 vCPU
   - RAM: 512MB

### Scaling Strategy

- **Scale Up**: When CPU > 70% for 5 minutes
- **Scale Down**: When CPU < 30% for 10 minutes
- **Horizontal Scaling**: Multiple instances behind load balancer
- **Vertical Scaling**: Increase CPU/RAM per instance

## Deployment Scripts

### Automated Deployment Script

Use the provided deployment script:

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

This script:
- Checks Railway CLI installation
- Installs dependencies
- Builds the application
- Runs database migrations
- Deploys to Railway
- Runs health check

### Production Startup Script

Use the provided startup script:

```bash
# Make script executable
chmod +x scripts/start-prod.sh

# Run startup
./scripts/start-prod.sh
```

This script:
- Verifies environment variables
- Creates necessary directories
- Runs database migrations
- Starts the application

## CI/CD Integration

### GitHub Actions

Already configured in `.github/workflows/railway-deploy.yml`:

```yaml
deploy-backend:
  name: Deploy Backend
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Install Railway CLI
      run: npm install -g @railway/cli

    - name: Deploy Backend to Railway
      run: railway up --service backend
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

    - name: Run Database Migrations
      run: railway run --service backend npm run migrate
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Configure GitHub Secrets

1. Go to GitHub repository settings
2. Add secrets:
   - `RAILWAY_TOKEN`: Get from Railway dashboard (Account Settings → API Tokens)
   - `JWT_SECRET`: Your JWT secret
   - `GEMINI_API_KEY`: Your Gemini API key
   - `OPENAI_API_KEY`: Your OpenAI API key

## Monitoring and Debugging

### View Logs

```bash
# View real-time logs
railway logs --service backend

# View logs with filtering
railway logs --service backend --grep "ERROR"
```

### Metrics

Railway automatically provides:
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

View in Railway Dashboard → Services → Metrics.

### Monitoring Endpoints

Add monitoring endpoints:

```typescript
app.get('/api/v1/health/detailed', authenticate, async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    timestamp: new Date().toISOString(),
  };
  res.json(health);
});
```

## Security Best Practices

### Environment Variables
- Use Railway's secret management
- Never commit secrets to Git
- Rotate secrets regularly
- Use different secrets for different environments

### Database Security
- PostgreSQL on private network
- Connection pooling enabled
- Regular backups
- Encrypted connections

### API Security
- JWT authentication
- Rate limiting
- CORS properly configured
- Input validation
- SQL injection prevention
- XSS protection (helmet)

### Network Security
- HTTPS enforced
- Security headers configured
- Rate limiting enabled
- No public database access

## Troubleshooting

### Database Connection Failed

**Symptoms:**
- Logs show connection errors
- Health check fails

**Solutions:**
1. Verify DATABASE_URL is set correctly
2. Check PostgreSQL service is running
3. Verify network connectivity
4. Check connection pool settings

### Build Fails

**Symptoms:**
- Build process errors
- Deployment fails

**Solutions:**
1. Check build logs in Railway
2. Verify all dependencies in package.json
3. Check TypeScript compilation
4. Verify build commands are correct

### CORS Errors

**Symptoms:**
- Browser shows CORS errors
- API calls fail

**Solutions:**
1. Verify CORS_ORIGIN is set correctly
2. Check allowed origins list
3. Verify credentials flag
4. Check preflight OPTIONS requests

### Health Check Fails

**Symptoms:**
- Health check returns errors
- Service marked unhealthy

**Solutions:**
1. Check health endpoint is accessible
2. Verify port is correct (3000)
3. Check logs for errors
4. Verify application is running

### Out of Memory

**Symptoms:**
- Service crashes
- OOM errors in logs

**Solutions:**
1. Increase RAM allocation
2. Optimize memory usage
3. Enable connection pooling
4. Add Redis for caching

## Rollback Procedure

### Automatic Rollback

Railway automatically rolls back on failed deployments.

### Manual Rollback

```bash
# View deployment history
railway deployments

# Rollback to previous deployment
railway rollback
```

### Database Rollback

Use Railway's point-in-time recovery:
1. Go to PostgreSQL service
2. Click "Backups"
3. Select backup point
4. Click "Restore"

## Cost Management

### Monitor Costs

View costs in Railway Dashboard → Project → Billing.

### Optimize Costs

- Use free tier for development
- Scale based on actual usage
- Enable caching to reduce database queries
- Optimize AI API calls
- Use Railway's reserved instances

### Estimated Monthly Costs

- Backend Service: $5-20/month (depending on scaling)
- PostgreSQL: $5-50/month (depending on plan)
- **Total**: $10-70/month

## Checklist

- [ ] Railway account created
- [ ] PostgreSQL service added
- [ ] Backend service added
- [ ] Environment variables configured
- [ ] CORS origins configured
- [ ] Health check endpoint working
- [ ] Database migrations run
- [ ] Custom domains configured (optional)
- [ ] CI/CD configured
- [ ] Monitoring set up
- [ ] Security verified
- [ ] Scaling configured
- [ ] Backup configuration verified
- [ ] Rollback procedure tested

## Next Steps

1. Deploy to Railway staging environment
2. Test all API endpoints
3. Configure custom domains
4. Set up monitoring and alerting
5. Conduct load testing
6. Deploy to production

## Support

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://github.com/railwayapp/cli
- Express.js Documentation: https://expressjs.com
- PostgreSQL Documentation: https://www.postgresql.org/docs/
