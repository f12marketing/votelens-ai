# VoteLens AI - Local Development Setup Guide

## Quick Fixes for Common Errors

If you're seeing errors right now, run these in order:

### With Docker (recommended):
```powershell
# 1. Fix npm (must be 7+ for workspace:* protocol)
npm --version
# If it shows 6.x, run:
npm install -g npm@latest

# 2. Start Docker Desktop manually first, then:
docker-compose up -d postgres redis

# 3-6. See full steps below
```

### Without Docker (no Docker Desktop needed):
See the **"Run Without Docker"** section below for using local PostgreSQL or a cloud database.

---

## Prerequisites

You need to install these tools before running VoteLens AI locally:

### Required
| Tool | Minimum Version | Download |
|------|----------------|----------|
| **Node.js** | 20.x LTS | https://nodejs.org/ |
| **npm** | 9.x | Included with Node.js |
| **Git** | 2.x | https://git-scm.com/downloads |

### Database (pick one)
| Option | What to do |
|--------|-----------|
| **Docker Desktop** | Easiest — runs PostgreSQL + Redis in containers |
| **Local PostgreSQL** | Install from https://www.enterprisedb.com/downloads |
| **Cloud PostgreSQL** | Railway, Neon, Supabase free tiers |
| **Skip Redis** | Comment out `REDIS_URL` in `.env` (caching disabled) |

### Optional (for full functionality)
| Tool | Purpose |
|------|---------|
| **Gemini API Key** | AI-powered election analytics (mock responses work without it) |
| **Firebase Project** | Authentication (local dev can work without it) |

---

## Step 1: Install Prerequisites

### Install Node.js & npm
**Windows (PowerShell - Admin):**
```powershell
# Using winget
winget install OpenJS.NodeJS

# Or download from https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
```

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

> **Important:** The project uses `workspace:*` protocol which requires **npm 7+**. If `npm --version` shows 6.x, you must upgrade:
> ```bash
> npm install -g npm@latest
> ```

### Install Docker Desktop
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## Run Without Docker (Alternative)

If you don't want to use Docker, you need to provide PostgreSQL and Redis yourself.

### Option A: Install PostgreSQL Locally (Windows)

1. Download PostgreSQL 15 installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Run the installer. Remember the password you set for the `postgres` user.
3. After install, open **pgAdmin 4** (included with the installer) or use `psql`.
4. Create the database:
   ```sql
   CREATE USER votelens WITH PASSWORD 'votelens';
   CREATE DATABASE votelens OWNER votelens;
   ```
5. Update `.env` to use your local PostgreSQL:
   ```env
   DATABASE_URL=postgresql://votelens:votelens@localhost:5432/votelens
   ```

### Option B: Use a Cloud PostgreSQL (Free Tier)

**Railway** (simplest — same platform you deploy to):
1. Go to https://railway.app
2. Create a new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from the service dashboard
4. Paste it into your `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:xxxx@xxxx.railway.app:5432/railway
   ```

**Neon** (free tier, serverless):
1. Sign up at https://neon.tech
2. Create a project, copy the connection string
3. Paste into `.env`

### Option C: Skip Redis (Simplest Start)

Redis is used for caching and background jobs. For initial local development, the app will mostly work without it.

In `.env`, you can point to a non-existent Redis or remove the line:
```env
# Comment out or remove:
# REDIS_URL=redis://localhost:6379
```

Some caching features will be slower or disabled, but core functionality works.

**If you do want Redis locally** (no Docker):
1. Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Or use Memurai (Windows-native Redis alternative): https://memurai.com/

---

## Step 2: Clone & Navigate

```bash
git clone https://github.com/votelens/votelens-ai.git
cd votelens-ai
```

---

## Step 3: Configure Environment

The `.env` file has already been created for local development at the project root:

**Check it exists:**
```bash
# Windows PowerShell
Get-Content .env

# macOS/Linux
cat .env
```

**Key local settings already configured:**
- `DATABASE_URL=postgresql://votelens:votelens@localhost:5432/votelens`
- `REDIS_URL=redis://localhost:6379`
- `PORT=3000`
- `CORS_ORIGIN=http://localhost:5173`
- `VITE_API_URL=http://localhost:3000`

### Optional: Add a Gemini API Key
To use AI features, get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and add it:

**Windows PowerShell:**
```powershell
# Append to .env
Add-Content -Path .env -Value "`nGEMINI_API_KEY=your-api-key-here"
```

**macOS/Linux:**
```bash
echo "GEMINI_API_KEY=your-api-key-here" >> .env
```

> Without a Gemini key, the AI endpoints will return mock data in development mode.

---

## Step 4: Start Infrastructure

### Option A: Docker (Easiest)
Start PostgreSQL and Redis using Docker Compose:

```bash
# Start just the database services
docker-compose up -d postgres redis
```

### Option B: No Docker — Local PostgreSQL
If you installed PostgreSQL locally, create the database:

```bash
# Connect to PostgreSQL (replace with your actual username if different)
psql -U postgres
```

Then run:
```sql
CREATE USER votelens WITH PASSWORD 'votelens';
CREATE DATABASE votelens OWNER votelens;
\q
```

Make sure your `.env` points to your local PostgreSQL (already set by default):
```env
DATABASE_URL=postgresql://votelens:votelens@localhost:5432/votelens
```

### Option C: No Docker — Cloud PostgreSQL
If you're using a cloud database (Railway, Neon, etc.), skip this step and just ensure your `.env` has the correct `DATABASE_URL`.

### Option D: Skip Redis
If you don't have Redis, caching and background jobs will be disabled but the app will still run. Comment out in `.env`:
```env
# REDIS_URL=redis://localhost:6379
```

Verify services are running:
```bash
docker-compose ps
```

You should see:
- `votelens-postgres` running on port `5432`
- `votelens-redis` running on port `6379`

---

## Step 5: Install Dependencies

The project uses npm workspaces. Install all dependencies from the root:

```bash
npm install
```

This installs dependencies for:
- Root workspace tools (`concurrently`, `turbo`, `prettier`)
- `backend/` (Express, Prisma, Winston, etc.)
- `frontend/` (React, Vite, Tailwind, etc.)
- `shared/` (shared types & utilities)

---

## Step 6: Set Up Database

Run Prisma migrations to create the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: seed with sample data
npm run db:seed
```

Verify database:
```bash
# Open Prisma Studio (GUI for database)
npm run db:studio
```

---

## Step 7: Start the Application

### Option A: Start everything at once (recommended)
```bash
npm run dev
```
This starts both frontend and backend concurrently using `concurrently`.

### Option B: Start services separately
**Terminal 1 - Backend:**
```bash
npm run dev:backend
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
# Runs on http://localhost:5173
```

### Option C: Docker Compose (everything in containers)
```bash
docker-compose up
```

---

## Step 8: Verify Everything Works

| URL | Description |
|-----|-------------|
| http://localhost:5173 | VoteLens AI frontend |
| http://localhost:3000/health | Backend health check |
| http://localhost:3000/api/v1 | API base |
| http://localhost:5555 | Prisma Studio (if running `db:studio`) |

Run the built-in diagnostics:
```bash
# Health check
curl http://localhost:3000/health

# Or PowerShell
Invoke-RestMethod -Uri http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

---

## Common Issues

### Issue: `npm error Unsupported URL Type "workspace:"`
**Cause:** npm version is too old. `workspace:*` requires npm 7+.

**Fix:**
```bash
npm install -g npm@latest
npm --version  # Should show 10.x.x
```
Then re-run `npm install`.

### Issue: `open //./pipe/dockerDesktopWindowsEngine: The system cannot find the file specified`
**Cause:** Docker Desktop is not running.

**Fix:** Start Docker Desktop from the Start menu, wait for the whale icon to stabilize, then retry:
```bash
docker-compose up -d postgres redis
```

### Issue: `prisma is not recognized` or `concurrently is not recognized`
**Cause:** `npm install` failed earlier, so dependencies were never installed.

**Fix:** Fix the underlying issue (usually npm version), then run:
```bash
npm install
```

### Issue: `node` or `npm` not found
**Fix:** Ensure Node.js is installed and added to your PATH. Restart your terminal after installation.

### Issue: Docker services won't start
**Fix:** Make sure Docker Desktop is running. On Windows, you may need to start Docker Desktop manually.

```bash
# Check Docker status
docker info

# Restart Docker Compose
docker-compose down
docker-compose up -d postgres redis
```

### Issue: `DATABASE_URL` connection refused
**Fix:** Ensure PostgreSQL container is running:
```bash
docker-compose logs postgres
```

If you see permission errors, the database might need initialization. Try:
```bash
docker-compose down -v  # Removes volumes (⚠️ deletes data)
docker-compose up -d postgres redis
npm run db:migrate
```

### Issue: Prisma migration fails
**Fix:**
```bash
# Reset and re-run migrations
npm run db:reset
# Or manually:
docker-compose exec postgres psql -U votelens -d votelens -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:migrate
```

### Issue: Port 3000 or 5173 already in use
**Fix:** Find and kill the process using the port, or change the port in `.env`:
```bash
# Windows - find process
Get-NetTCPConnection -LocalPort 3000

# macOS/Linux
lsof -i :3000
```

Then update `.env`:
```env
PORT=3001
VITE_API_URL=http://localhost:3001
```

### Issue: npm install fails with workspace errors
**Fix:** Make sure you're using npm 9+ (check with `npm --version`). If using an older version:
```bash
npm install -g npm@latest
```

---

## Development Commands Reference

```bash
# Run everything
npm run dev

# Run individually
npm run dev:backend
npm run dev:frontend

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:migrate:deploy # Deploy migrations (production style)
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset database (⚠️ destructive)

# Build
npm run build            # Build frontend + backend
npm run build:frontend
npm run build:backend

# Testing
npm run test             # Run all tests
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Docker
npm run docker:up        # Start Docker Compose
npm run docker:down      # Stop Docker Compose
npm run docker:logs      # View Docker logs

# Formatting
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
```

---

## Architecture for Local Dev

```
┌─────────────────────────────────────────────┐
│               Browser                       │
│         http://localhost:5173               │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│          Frontend (Vite)                  │
│         Port: 5173 (React)                │
└───────────────┬─────────────────────────────┘
                │ API calls
┌───────────────▼─────────────────────────────┐
│          Backend (Express)                │
│         Port: 3000 (Node.js)              │
└───┬───────────┬─────────────────────────────┘
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│PostgreSQL│  │  Redis  │
│Port 5432│  │Port 6379│
└────────┘  └────────┘
```

---

## What's Next?

Once running locally, you can:
1. Visit http://localhost:5173 to use the app
2. View the monitoring architecture docs in the repo
3. Check the API docs at the backend `/api/v1` endpoints
4. Explore Prisma Studio at http://localhost:5555

For production deployment, see `RAILWAY_DEPLOYMENT.md` and `DEPLOYMENT_WORKFLOW.md`.
