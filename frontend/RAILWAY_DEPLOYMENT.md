# VoteLens AI Frontend - Railway Deployment Guide

## Overview

This guide covers deploying the VoteLens AI React + Vite frontend to Railway with production-grade optimizations including SPA routing, gzip compression, asset optimization, and nginx-based static hosting.

## Deployment Strategy

### Option 1: Railway Static Site (Recommended)

Railway's built-in static site hosting with CDN:
- Automatic HTTPS
- Global CDN distribution
- Zero configuration
- Automatic scaling

### Option 2: Docker + Nginx

Full containerized deployment with custom nginx:
- Complete control over nginx configuration
- Custom headers and caching
- Advanced compression
- SPA routing support

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`
- Docker installed (for Option 2)
- Domain name (optional, for custom domains)

## Option 1: Railway Static Site Deployment

### Step 1: Configure Environment Variables

Create `.env.production` in the frontend directory:

```bash
# Production environment variables
VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
VITE_APP_URL=https://vote-lens-ai.railway.app
```

### Step 2: Update nixpacks.toml

Already configured in `frontend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.build]
cmds = ["npm install", "npm run build"]

[start]
cmd = "npm run preview"

[static]
main = "dist"

[variables]
NODE_ENV = "production"
VITE_API_URL = "${{VITE_API_URL}}"
VITE_APP_URL = "${{VITE_APP_URL}}"
```

### Step 3: Deploy via Railway CLI

```bash
# Navigate to frontend directory
cd frontend

# Login to Railway
railway login

# Initialize Railway project (if not already done)
railway init

# Add frontend service
railway add frontend

# Set service name
railway set frontend --name vote-lens-ai-frontend

# Configure as static site
railway set frontend --type static

# Set environment variables
railway variables set VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai.railway.app

# Deploy
railway up
```

### Step 4: Verify Deployment

```bash
# Get deployment URL
railway domain

# Test deployment
curl https://vote-lens-ai-frontend.railway.app/
```

## Option 2: Docker + Nginx Deployment

### Step 1: Build Docker Image Locally

```bash
# Navigate to frontend directory
cd frontend

# Build Docker image
docker build -t vote-lens-ai-frontend .

# Test locally
docker run -p 8080:8080 vote-lens-ai-frontend

# Test SPA routing
curl http://localhost:8080/
curl http://localhost:8080/dashboard
curl http://localhost:8080/analytics
```

### Step 2: Push to Docker Registry

```bash
# Tag image
docker tag vote-lens-ai-frontend your-registry/vote-lens-ai-frontend:latest

# Push to registry
docker push your-registry/vote-lens-ai-frontend:latest
```

### Step 3: Deploy to Railway

```bash
# Add service to Railway
railway add frontend

# Configure as Docker service
railway set frontend --type docker

# Set Docker image
railway variables set DOCKER_IMAGE=your-registry/vote-lens-ai-frontend:latest

# Set environment variables
railway variables set VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai.railway.app

# Deploy
railway up
```

## Production Build Optimization

### Build Configuration

The `vite.config.ts` is optimized for production:

```typescript
build: {
  outDir: 'dist',
  sourcemap: false,              // Disable sourcemaps for production
  minify: 'terser',              // Use terser for minification
  terserOptions: {
    compress: {
      drop_console: true,        // Remove console.log
      drop_debugger: true,       // Remove debugger statements
    },
  },
  rollupOptions: {
    output: {
      manualChunks: {            // Code splitting
        vendor: ['react', 'react-dom', 'react-router-dom'],
        ui: ['@radix-ui/*'],
        query: ['@tanstack/react-query'],
        charts: ['recharts'],
        maps: ['leaflet', 'react-leaflet'],
      },
      chunkFileNames: 'assets/js/[name]-[hash].js',
      entryFileNames: 'assets/js/[name]-[hash].js',
      assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
    },
  },
  chunkSizeWarningLimit: 1000,
}
```

### Build Scripts

Available npm scripts:

```bash
# Development build
npm run build

# Production build with environment variables
npm run build:prod

# Build with bundle analysis
npm run build:analyze

# Preview production build locally
npm run preview:prod

# Clean build artifacts
npm run clean
```

### Nginx Configuration

The `nginx.conf` includes:

- **Gzip compression** for text-based assets
- **Security headers** (X-Frame-Options, CSP, etc.)
- **Cache control** for static assets (1 year)
- **SPA routing** via try_files fallback
- **Health check** endpoint
- **Asset optimization** (expires headers)

## SPA Routing Configuration

### Nginx Configuration

```nginx
location / {
    try_files $uri $uri/ /index.html;
    expires 1h;
    add_header Cache-Control "public";
}
```

### .htaccess Fallback

The `.htaccess` file provides fallback for Railway static hosting:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Environment Variables

### Required Variables

```bash
VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
VITE_APP_URL=https://vote-lens-ai.railway.app
```

### Optional Variables

```bash
NODE_ENV=production
```

### Setting Variables in Railway

```bash
# Via CLI
railway variables set VITE_API_URL=https://api.vote-lens-ai.railway.app/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai.railway.app

# Via Dashboard
# Go to service → Settings → Variables
```

## Custom Domain Configuration

### Step 1: Add Domain in Railway

1. Go to Railway Dashboard
2. Select `vote-lens-ai-frontend` service
3. Click "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `vote-lens-ai.yourdomain.com`
6. Click "Add Domain"

### Step 2: Configure DNS

Add CNAME record in your DNS provider:

```
Type: CNAME
Name: vote-lens-ai
Value: vote-lens-ai-frontend.railway.app
TTL: 300
```

### Step 3: Update Environment Variables

After custom domain is configured:

```bash
railway variables set VITE_APP_URL=https://vote-lens-ai.yourdomain.com
```

### Step 4: Redeploy

```bash
railway up
```

## Performance Optimization

### Asset Optimization

1. **Code Splitting**: Automatic via Vite
2. **Tree Shaking**: Enabled by default
3. **Minification**: Terser with console removal
4. **Compression**: Gzip via nginx
5. **Caching**: 1-year cache for static assets

### Bundle Size Analysis

```bash
# Build with analysis
npm run build:analyze

# This will generate bundle analysis report
```

### CDN Configuration

Railway automatically serves static assets through CDN:
- Edge caching
- Geographic distribution
- Automatic cache invalidation

## Monitoring and Debugging

### View Logs

```bash
# View real-time logs
railway logs

# View logs for specific service
railway logs --service frontend
```

### Health Check

```bash
# Check health endpoint
curl https://vote-lens-ai-frontend.railway.app/health
```

### Browser DevTools

Check:
- Network tab for asset loading
- Console for errors
- Performance tab for load times
- Lighthouse for performance score

## Troubleshooting

### Issue: SPA Routes Not Working

**Symptoms**: Refreshing a route shows 404

**Solutions:**
1. Verify nginx configuration has try_files
2. Check .htaccess is deployed
3. Verify Railway static site is configured
4. Check build output includes index.html

### Issue: Assets Not Loading

**Symptoms**: CSS/JS files return 404

**Solutions:**
1. Check asset paths in build output
2. Verify base path in vite.config.ts
3. Check nginx static file configuration
4. Verify dist directory structure

### Issue: Environment Variables Not Working

**Symptoms**: API calls failing with wrong URL

**Solutions:**
1. Verify variables are set in Railway
2. Check variables use VITE_ prefix
3. Rebuild after variable changes
4. Verify variable names match exactly

### Issue: Build Fails

**Symptoms**: Build process errors

**Solutions:**
1. Check build logs in Railway
2. Verify all dependencies in package.json
3. Check TypeScript compilation
4. Verify build commands are correct

### Issue: Slow Load Times

**Symptoms**: Poor performance

**Solutions:**
1. Enable gzip compression
2. Verify CDN is working
3. Check asset sizes
4. Enable browser caching
5. Optimize images

## CI/CD Integration

### GitHub Actions

Already configured in `.github/workflows/railway-deploy.yml`:

```yaml
deploy-frontend:
  name: Deploy Frontend
  runs-on: ubuntu-latest
  needs: deploy-backend
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Install Railway CLI
      run: npm install -g @railway/cli

    - name: Deploy Frontend to Railway
      run: railway up --service frontend
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Manual Deployment

```bash
# Deploy frontend only
railway up --service frontend

# Deploy with specific branch
railway up --branch main
```

## Security Best Practices

1. **HTTPS Only**: Railway enforces HTTPS
2. **Security Headers**: Configured in nginx
3. **CORS**: Configure on backend
4. **Environment Variables**: Use Railway secrets
5. **No Console Logs**: Removed in production build
6. **Content Security Policy**: Configured in nginx

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

## Cost Optimization

- **Static Site**: Free on Railway
- **Docker Service**: $5-20/month depending on usage
- **Bandwidth**: Included in Railway pricing
- **CDN**: Included in Railway pricing

Estimated cost: $0 (static site) or $5-20/month (Docker)

## Checklist

- [ ] Environment variables configured
- [ ] Build configuration optimized
- [ ] SPA routing tested
- [ ] Nginx configuration verified
- [ ] Health check endpoint working
- [ ] Custom domains configured (optional)
- [ ] CI/CD pipeline configured
- [ ] Monitoring set up
- [ ] Security headers verified
- [ ] Performance optimized
- [ ] Rollback procedure tested

## Next Steps

1. Deploy to Railway staging environment
2. Test all routes and functionality
3. Configure custom domains
4. Set up monitoring and alerting
5. Test performance with Lighthouse
6. Deploy to production

## Support

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://github.com/railwayapp/cli
- Vite Documentation: https://vitejs.dev
- Nginx Documentation: https://nginx.org/en/docs/
