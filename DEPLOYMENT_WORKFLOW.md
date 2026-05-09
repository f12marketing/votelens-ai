# VoteLens AI - Railway Deployment Workflow

## Prerequisites

- Railway account (https://railway.app)
- GitHub account with VoteLens AI repository
- Domain name (optional, for custom domains)
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Initial Railway Setup

### 1.1 Create Railway Project

```bash
# Login to Railway
railway login

# Initialize Railway project in repository
cd /path/to/vote-lens-ai
railway init
```

This will create a new project in Railway and link it to your repository.

### 1.2 Create PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# Set database name
railway set postgresql --name vote-lens-ai-db
```

Railway will automatically inject `DATABASE_URL` environment variable.

### 1.3 Create Backend Service

```bash
# Add backend service
railway add backend

# Set service name
railway set backend --name vote-lens-ai-backend
```

### 1.4 Create Frontend Service

```bash
# Add frontend service
railway add frontend

# Set service name
railway set frontend --name vote-lens-ai-frontend
```

## Step 2: Configure Environment Variables

### 2.1 Backend Environment Variables

```bash
# Set backend service
railway set backend

# Add environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=${{JWT_SECRET}}
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
```

### 2.2 Frontend Environment Variables

```bash
# Set frontend service
railway set frontend

# Add environment variables
railway variables set VITE_API_URL=https://vote-lens-ai-backend.railway.app/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai-frontend.railway.app
```

### 2.3 Reference Database URL

The `DATABASE_URL` is automatically injected by Railway PostgreSQL service. Reference it in backend:

```bash
# Set backend service
railway set backend

# Reference database URL
railway variables set DATABASE_URL=${{DATABASE_URL}}
```

## Step 3: Configure Build Settings

### 3.1 Backend Build Settings

Via Railway Dashboard:
1. Go to `vote-lens-ai-backend` service
2. Click "Settings" → "Build"
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Healthcheck Path: `/health`
   - Healthcheck Timeout: `300`

Or via CLI (already configured in `backend/nixpacks.toml`):

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "postgresql"]

[phases.build]
cmds = ["npm install", "npm run build"]

[start]
cmd = "npm run start:prod"

[variables]
NODE_ENV = "production"
PORT = "3000"
```

### 3.2 Frontend Build Settings

Via Railway Dashboard:
1. Go to `vote-lens-ai-frontend` service
2. Click "Settings" → "Build"
3. Configure:
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Healthcheck Path: `/`

Or via CLI (already configured in `frontend/nixpacks.toml`):

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.build]
cmds = ["npm install", "npm run build"]

[start]
cmd = "npm run preview"

[static]
main = "dist"
```

## Step 4: Deploy Services

### 4.1 Deploy Backend

```bash
# Set backend service
railway set backend

# Deploy backend
railway up

# Monitor logs
railway logs
```

Wait for deployment to complete. Check for any errors in logs.

### 4.2 Run Database Migrations

```bash
# Run migrations on backend service
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
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS constituencies (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      state VARCHAR(100) NOT NULL,
      district VARCHAR(100),
      total_voters INTEGER NOT NULL,
      urban_percentage DECIMAL(5,2),
      rural_percentage DECIMAL(5,2),
      literacy_rate DECIMAL(5,2),
      median_age DECIMAL(4,1),
      population INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await client.end();
  console.log('Migrations completed');
}

migrate().catch(console.error);
```

### 4.3 Deploy Frontend

```bash
# Set frontend service
railway set frontend

# Deploy frontend
railway up

# Monitor logs
railway logs
```

## Step 5: Verify Deployment

### 5.1 Check Backend Health

```bash
# Get backend URL
railway domain

# Check health endpoint
curl https://vote-lens-ai-backend.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-05-09T12:00:00.000Z"
}
```

### 5.2 Check Frontend

```bash
# Get frontend URL
railway domain

# Check frontend
curl https://vote-lens-ai-frontend.railway.app/
```

### 5.3 Test API Endpoints

```bash
# Test authentication endpoint
curl -X POST https://vote-lens-ai-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test elections endpoint
curl https://vote-lens-ai-backend.railway.app/api/v1/elections
```

## Step 6: Configure Custom Domains (Optional)

### 6.1 Add Frontend Domain

Via Railway Dashboard:
1. Go to `vote-lens-ai-frontend` service
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter: `vote-lens-ai.yourdomain.com`
5. Click "Add Domain"

### 6.2 Add Backend Domain

Via Railway Dashboard:
1. Go to `vote-lens-ai-backend` service
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter: `api.vote-lens-ai.yourdomain.com`
5. Click "Add Domain"

### 6.3 Configure DNS

Add CNAME records in your DNS provider:

```
vote-lens-ai.yourdomain.com CNAME vote-lens-ai-frontend.railway.app
api.vote-lens-ai.yourdomain.com CNAME vote-lens-ai-backend.railway.app
```

### 6.4 Update Environment Variables

After custom domains are configured, update:

```bash
# Frontend
railway set frontend
railway variables set VITE_API_URL=https://api.vote-lens-ai.yourdomain.com/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai.yourdomain.com

# Backend
railway set backend
railway variables set CORS_ORIGIN=https://vote-lens-ai.yourdomain.com
```

### 6.5 Redeploy Services

```bash
# Redeploy frontend
railway set frontend
railway up

# Redeploy backend
railway set backend
railway up
```

## Step 7: Set Up CI/CD

### 7.1 Configure GitHub Secrets

1. Go to GitHub repository settings
2. Add secrets:
   - `RAILWAY_TOKEN`: Get from Railway dashboard (Account Settings → API Tokens)
   - `RAILWAY_PROJECT_ID`: Get from Railway project settings

### 7.2 Enable GitHub Actions

The workflow is already configured in `.github/workflows/railway-deploy.yml`.

Push to main branch to trigger automatic deployment:
```bash
git add .
git commit -m "Enable Railway CI/CD"
git push origin main
```

## Step 8: Configure Monitoring

### 8.1 Enable Railway Metrics

Railway automatically provides metrics:
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

View in Railway Dashboard → Services → Metrics.

### 8.2 Set Up Alerts

Via Railway Dashboard:
1. Go to Project Settings → Notifications
2. Configure email alerts for:
   - Deployment failures
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - High error rate (>5%)

### 8.3 Configure Logging

Structured logging is already configured. View logs:
```bash
# View backend logs
railway logs --service backend

# View frontend logs
railway logs --service frontend
```

## Step 9: Database Backup Configuration

Railway automatically creates daily backups. Configure additional settings:

Via Railway Dashboard:
1. Go to PostgreSQL service
2. Click "Settings" → "Backups"
3. Configure:
   - Backup retention (default: 7 days)
   - Point-in-time recovery (enabled by default)

## Step 10: Scaling Configuration

### 10.1 Configure Backend Scaling

Via Railway Dashboard:
1. Go to `vote-lens-ai-backend` service
2. Click "Settings" → "Scaling"
3. Configure:
   - Min Instances: 1
   - Max Instances: 10
   - CPU: 0.5 vCPU
   - RAM: 512MB

### 10.2 Configure Database Scaling

Via Railway Dashboard:
1. Go to PostgreSQL service
2. Click "Settings" → "Scaling"
3. Select appropriate plan based on usage:
   - Starter-0: 512MB RAM, 1 vCPU
   - Standard-0: 1GB RAM, 1 vCPU
   - Standard-1: 2GB RAM, 1 vCPU

## Troubleshooting

### Deployment Fails

1. Check build logs:
   ```bash
   railway logs --service backend
   ```

2. Verify build commands are correct
3. Check for missing dependencies in package.json
4. Verify environment variables are set

### Database Connection Failed

1. Verify DATABASE_URL is set
2. Check PostgreSQL service is running
3. Verify network connectivity
4. Check connection pool settings

### Frontend Cannot Connect to Backend

1. Verify VITE_API_URL is correct
2. Check CORS settings
3. Verify backend is running
4. Check health endpoint

### Custom Domain Not Working

1. Verify DNS records are correct
2. Check DNS propagation (use dig command)
3. Wait for SSL certificate issuance
4. Verify domain validation in Railway

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

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review costs and scaling
- **Monthly**: Review and rotate secrets
- **Quarterly**: Update dependencies

### Update Procedure

1. Update dependencies locally
2. Test thoroughly
3. Commit and push to main
4. Railway automatically deploys
5. Monitor deployment
6. Verify functionality

## Cost Management

### Monitor Costs

View costs in Railway Dashboard → Project → Billing.

### Optimize Costs

- Use free tier for development
- Scale based on actual usage
- Enable caching to reduce database queries
- Optimize AI API calls
- Use Railway's reserved instances for predictable costs

### Estimated Monthly Costs

- Frontend (Static): $0
- Backend: $5-20/month
- PostgreSQL: $5-50/month
- **Total**: $10-70/month

## Support

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://github.com/railwayapp/cli
- Railway Community: https://community.railway.app
- Support: support@railway.app

## Checklist

- [ ] Railway account created
- [ ] Project initialized
- [ ] PostgreSQL service created
- [ ] Backend service created
- [ ] Frontend service created
- [ ] Environment variables configured
- [ ] Build settings configured
- [ ] Backend deployed
- [ ] Database migrations run
- [ ] Frontend deployed
- [ ] Health checks passing
- [ ] Custom domains configured (optional)
- [ ] CI/CD configured
- [ ] Monitoring configured
- [ ] Backup configuration verified
- [ ] Scaling configured
- [ ] Support documentation reviewed
