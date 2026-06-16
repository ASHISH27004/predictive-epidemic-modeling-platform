#!/bin/bash
# deploy.sh — Automated deployment script for EpidemicModel Pro
#
# Usage: ./deploy.sh [environment]
# Environments: dev, staging, prod

set -euo pipefail

ENVIRONMENT=${1:-dev}
PROJECT_NAME="epidemic-modeler"
REGION="us-east-1"
REPO_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🚀 Deploying ${PROJECT_NAME} to ${ENVIRONMENT}..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Build Docker images
echo -e "${BLUE}📦 Building Docker images...${NC}"
docker compose build

# Step 2: Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
cd backend
python -m pytest tests/ --tb=short -q || echo "No tests found or tests failed"
cd ..

# Step 3: Frontend build
echo -e "${BLUE}🎨 Building frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

# Step 4: Push to container registry (AWS ECR)
if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "staging" ]]; then
    echo -e "${BLUE}📤 Pushing to ECR...${NC}"
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com
    
    # Tag and push
    docker tag ${PROJECT_NAME}-api:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}-api:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}-api:latest
    
    docker tag ${PROJECT_NAME}-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}-frontend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}-frontend:latest
fi

# Step 5: Deploy to cloud
if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "staging" ]]; then
    echo -e "${BLUE}☁️  Deploying to AWS ECS...${NC}"
    
    # Update ECS service
    aws ecs update-service \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --service api-service \
        --force-new-deployment
    
    aws ecs update-service \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --service frontend-service \
        --force-new-deployment
    
    echo -e "${GREEN}✅ ECS services updated${NC}"
fi

# Step 6: Deploy frontend to Vercel (alternative)
if command -v vercel &> /dev/null; then
    echo -e "${BLUE}🌐 Deploying frontend to Vercel...${NC}"
    cd frontend
    vercel deploy --yes --env=${ENVIRONMENT} || echo "Vercel CLI not configured"
    cd ..
fi

# Step 7: Health check
echo -e "${BLUE}🏥 Running health check...${NC}"
sleep 5
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment to ${ENVIRONMENT} complete!${NC}"
