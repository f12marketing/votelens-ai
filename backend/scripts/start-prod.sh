#!/bin/bash

# VoteLens AI Backend - Production Startup Script
# This script handles the production startup process with health checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting VoteLens AI Backend in Production Mode${NC}"

# Verify environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET environment variable is not set${NC}"
    exit 1
fi

# Create necessary directories
mkdir -p logs uploads

# Set production environment
export NODE_ENV=production

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
if [ -f "node_modules/.bin/prisma" ]; then
    npx prisma migrate deploy || echo -e "${YELLOW}⚠️  Prisma migrations not configured or failed${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma not installed, skipping migrations${NC}"
fi

# Start the application
echo -e "${GREEN}✅ Starting application server...${NC}"
exec node dist/app.js
