# Railway Networking & Custom Domains Configuration

## Network Architecture

### Service Communication

VoteLens AI uses Railway's internal networking for secure service-to-service communication:

```
Internet
    │
    ▼
┌─────────────────────────────────────────┐
│         Railway Load Balancer           │
│         (HTTPS Termination)             │
└─────────────────────────────────────────┘
    │                    │
    ▼                    ▼
┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │
│   Service    │◄────►│   Service    │
│   (Public)   │      │   (Public)   │
└──────────────┘      └──────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │ PostgreSQL   │
                    │   (Private)  │
                    └──────────────┘
```

### Private Network

- **Backend ↔ Database**: Private Railway network
- **Backend ↔ Redis** (if used): Private Railway network
- **Frontend ↔ Backend**: Public HTTPS (VITE_API_URL)

## Custom Domain Configuration

### Step 1: Add Domain in Railway Dashboard

**Frontend Domain:**
1. Go to Railway Dashboard
2. Select `vote-lens-ai-frontend` service
3. Click "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `vote-lens-ai.yourdomain.com`
6. Click "Add Domain"

**Backend Domain:**
1. Go to Railway Dashboard
2. Select `vote-lens-ai-backend` service
3. Click "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `api.vote-lens-ai.yourdomain.com`
6. Click "Add Domain"

### Step 2: Configure DNS

**For Frontend (vote-lens-ai.yourdomain.com):**
```
Type: CNAME
Name: vote-lens-ai
Value: vote-lens-ai-frontend.railway.app
TTL: 300
```

**For Backend (api.vote-lens-ai.yourdomain.com):**
```
Type: CNAME
Name: api
Value: vote-lens-ai-backend.railway.app
TTL: 300
```

### Step 3: Verify DNS Propagation

```bash
# Check frontend DNS
dig vote-lens-ai.yourdomain.com

# Check backend DNS
dig api.vote-lens-ai.yourdomain.com
```

### Step 4: SSL/TLS Configuration

Railway automatically provisions SSL certificates via Let's Encrypt:
- Certificates are auto-renewed
- HTTPS is enforced by default
- No manual configuration needed

## Environment Variables for Custom Domains

Update Railway environment variables after custom domains are configured:

**Frontend:**
```bash
VITE_API_URL=https://api.vote-lens-ai.yourdomain.com/api/v1
VITE_APP_URL=https://vote-lens-ai.yourdomain.com
```

**Backend:**
```bash
CORS_ORIGIN=https://vote-lens-ai.yourdomain.com
```

## Service Health Checks

### Backend Health Check

Already implemented in `backend/src/app/app.ts`:
```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});
```

Railway configuration:
```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

### Frontend Health Check

Railway configuration:
```toml
[deploy]
healthcheckPath = "/"
healthcheckTimeout = 60
```

## Network Security

### Firewall Rules

Railway automatically configures:
- **Database**: Private network only (no public access)
- **Backend**: Public HTTPS, protected by rate limiting
- **Frontend**: Public HTTPS, static files only

### Rate Limiting

Backend rate limiting configured in `backend/src/middleware/rate-limit.middleware.ts`:
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Upload endpoints: 10 requests per 15 minutes

### CORS Configuration

Backend CORS configured in `backend/src/app/app.ts`:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
```

## Service Discovery

Railway provides automatic service discovery via environment variables:

### Database URL
```bash
DATABASE_URL=${{DATABASE_URL}}
```
Automatically injected by Railway PostgreSQL service.

### Service URLs
```bash
# Backend URL (for frontend)
BACKEND_URL=https://vote-lens-ai-backend.railway.app

# Frontend URL (for redirects)
FRONTEND_URL=https://vote-lens-ai-frontend.railway.app
```

## Load Balancing

Railway automatically handles:
- **Frontend**: CDN-based load balancing for static assets
- **Backend**: Round-robin load balancing across instances
- **Database**: Connection pooling via PgBouncer

## Monitoring Network Performance

### Railway Metrics

Monitor in Railway Dashboard:
- Response times
- Error rates
- Request counts
- Network latency
- Bandwidth usage

### Custom Monitoring

Add monitoring endpoints:

```typescript
// backend/src/app/routes.ts
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

## Troubleshooting Network Issues

### 1. Database Connection Failed

**Symptoms:**
- Backend logs show connection errors
- Health check fails

**Solutions:**
1. Verify DATABASE_URL is set correctly
2. Check PostgreSQL service is running
3. Verify network connectivity in Railway dashboard
4. Check database is not at connection limit

### 2. Frontend Cannot Connect to Backend

**Symptoms:**
- API calls fail with CORS errors
- 404 or 502 errors

**Solutions:**
1. Verify VITE_API_URL is correct
2. Check CORS settings on backend
3. Verify backend service is running
4. Check health check endpoint

### 3. DNS Not Propagating

**Symptoms:**
- Custom domain shows Railway URL
- DNS lookup returns wrong IP

**Solutions:**
1. Verify DNS records are correct
2. Check DNS TTL settings
3. Wait for propagation (up to 48 hours)
4. Use Railway's default URL temporarily

### 4. SSL Certificate Issues

**Symptoms:**
- Browser shows certificate errors
- Mixed content warnings

**Solutions:**
1. Verify DNS is correctly pointing to Railway
2. Wait for Let's Encrypt certificate issuance
3. Check domain validation in Railway dashboard
4. Ensure no conflicting SSL configurations

## Network Optimization

### CDN Configuration

Railway automatically serves static assets through CDN:
- Frontend assets cached at edge locations
- Reduced latency for global users
- Automatic cache invalidation on deployment

### Connection Pooling

Database connection pooling configured:
```bash
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Keep-Alive Connections

Enable HTTP keep-alive:
```typescript
// backend/src/app/server.ts
const server = app.listen(port, () => {
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});
```

## Security Best Practices

1. **Always use HTTPS** - Railway enforces HTTPS
2. **Private database** - No public database access
3. **Rate limiting** - Prevent abuse and DDoS
4. **CORS restrictions** - Only allow trusted origins
5. **Secrets management** - Use Railway's secret variables
6. **Regular updates** - Keep dependencies updated
7. **Monitor logs** - Watch for suspicious activity

## Next Steps

1. Deploy to Railway staging environment
2. Configure custom domains
3. Set up monitoring and alerting
4. Test network connectivity
5. Verify SSL certificates
6. Configure DNS records
7. Update environment variables
8. Deploy to production
