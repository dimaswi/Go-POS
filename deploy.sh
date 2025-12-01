#!/bin/bash

# ===========================================
# Go-POS Production Deployment Script
# ===========================================

set -e

echo "🚀 Starting Go-POS Production Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production with your production settings"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${YELLOW}📦 Step 1: Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}🛑 Step 2: Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${YELLOW}🚀 Step 3: Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}⏳ Step 4: Waiting for services to be healthy...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}🔍 Step 5: Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Check backend health
echo -e "${YELLOW}🏥 Step 6: Checking backend health...${NC}"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️ Backend health check failed (might need more time)${NC}"
fi

# Check frontend
echo -e "${YELLOW}🌐 Step 7: Checking frontend...${NC}"
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend health check failed (might need more time)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Application URL: http://your-server-ip"
echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
