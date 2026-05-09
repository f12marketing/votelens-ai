#!/bin/bash

# VoteLens AI Backend - Railway Deployment Script
# This script automates the deployment process to Railway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="vote-lens-ai-backend"
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo -e "${GREEN}🚀 Starting VoteLens AI Backend Deployment${NC}"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway. Please login:${NC}"
    railway login
fi

# Navigate to backend directory
cd "$PROJECT_DIR"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
railway run --service backend npm run migrate || echo -e "${YELLOW}⚠️  Migration script not found or failed${NC}"

# Deploy to Railway
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"
railway up --service backend

# Get deployment URL
DEPLOYMENT_URL=$(railway domain --service backend)
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Deployment URL: ${DEPLOYMENT_URL}${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 10
HEALTH_URL="${DEPLOYMENT_URL}/health"
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
