# Railway Deployment Fix - "Cannot GET /" Error

## Issue

The frontend is deployed to Railway but shows "Cannot GET /" when visiting the app URL. This typically happens when:
- The frontend service is not configured as a static site
- The build output directory is not correctly specified
- Railway is treating it as a Node service instead of serving static files

## Solution

### Option 1: Fix Current Frontend Service

#### Step 1: Push Updated Files to GitHub
```bash
git add frontend/nixpacks.toml railway.json
git commit -m "Fix Railway frontend static site configuration"
git push origin main
```

#### Step 2: Check Frontend Service Configuration in Railway
1. Go to Railway Dashboard (https://railway.app)
2. Select your VoteLens AI project
3. Click on the frontend service
4. Go to **Settings** tab
5. Check the **Build** section:
   - Build Command should be: `npm install && npm run build`
6. If there's a **Start Command** or **Startup Command**, delete it and save

#### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **New Deployment** (or it will auto-deploy from the push)

**How it works**: Railway will automatically detect static files from the `dist` folder when there's no start command and deploy them.

### Option 2: Delete and Recreate Frontend Service (If Option 1 Fails)

#### Step 1: Delete Current Frontend Service
1. Go to Railway Dashboard
2. Select your VoteLens AI project
3. Click on the frontend service
4. Click **Settings** → **Delete Service**
5. Confirm deletion

#### Step 2: Add New Service from GitHub
1. In your project, click **New Service**
2. Select **GitHub repo**
3. Select your VoteLens AI repository
4. Set **Root Directory** to: `frontend` (this is the key step)
5. Click **Create Service**

#### Step 3: Configure Build Settings
1. Click on the new frontend service
2. Go to **Settings** tab
3. Under **Build** section:
   - Build Command: `npm install && npm run build`
   - (No Start Command needed - leave blank)

#### Step 4: Configure Environment Variables
1. Go to **Variables** tab
2. Add:
   ```
   VITE_API_URL=https://api.vote-lens-ai-backend.railway.app/api/v1
   VITE_APP_URL=https://vote-lens-ai-frontend.railway.app
   NODE_ENV=production
   ```

#### Step 5: Deploy
1. Click **New Deployment** in the Deployments tab
2. Wait for deployment to complete

**Important**: Railway will detect the built files in the `dist` directory and serve them as a static site automatically. The nixpacks.toml file in the frontend directory tells Railway the output is in `dist`.

### Option 3: Use Railway CLI to Redeploy

#### Step 1: Login to Railway
```bash
railway login
```

#### Step 2: Navigate to Project
```bash
cd /path/to/vote-lens-ai
railway link
```

#### Step 3: Delete Frontend Service
```bash
railway remove frontend
```

#### Step 4: Add Frontend Service as Static Site
```bash
railway add frontend
railway set frontend --type static
```

#### Step 5: Configure Build
```bash
railway set frontend
railway variables set BUILD_COMMAND="npm install && npm run build"
railway variables set OUTPUT_DIR="dist"
```

#### Step 6: Set Environment Variables
```bash
railway variables set VITE_API_URL=https://api.vote-lens-ai-backend.railway.app/api/v1
railway variables set VITE_APP_URL=https://vote-lens-ai-frontend.railway.app
```

#### Step 7: Deploy
```bash
railway up --service frontend
```

## Files Changed

I've updated the following files to fix the configuration:

### 1. `frontend/nixpacks.toml`
- Removed the `[start]` section (static sites don't need start commands)
- Kept the `[static]` section with `main = "dist"`

### 2. `railway.json`
- Removed the `deploy` section from the frontend service
- Simplified the configuration for static site hosting

## Verify Fix

After applying one of the solutions:

1. Wait for deployment to complete
2. Visit your frontend URL
3. You should see the VoteLens AI application
4. Test navigation between routes
5. Check browser console for errors

## Common Issues

### Issue: Still getting "Cannot GET /"
**Solution**: Ensure the service type is set to "Static Site" in Railway dashboard, not "Node Service"

### Issue: Assets not loading (404 errors)
**Solution**: Check that the output directory is set to `dist` in Railway settings

### Issue: API calls failing
**Solution**: Verify `VITE_API_URL` is set correctly in environment variables

### Issue: Routes not working on refresh
**Solution**: This should be handled by Railway's static site hosting, but if it persists, check that the build output includes the `.htaccess` file

## Next Steps

1. Push the updated files to GitHub:
   ```bash
   git add frontend/nixpacks.toml railway.json
   git commit -m "Fix Railway frontend deployment configuration"
   git push origin main
   ```

2. Trigger a new deployment on Railway

3. Verify the frontend is working

4. Test all routes and functionality

## Support

If you're still experiencing issues:
- Check Railway logs: `railway logs --service frontend`
- Verify build output locally: `cd frontend && npm run build && ls -la dist/`
- Contact Railway support: https://railway.app/support
