# ===========================================
# Go-POS Production Deployment Script (Windows)
# ===========================================

Write-Host "🚀 Starting Go-POS Production Deployment..." -ForegroundColor Cyan

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your production settings"
    exit 1
}

# Step 1: Build
Write-Host "`n📦 Step 1: Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Stop existing
Write-Host "`n🛑 Step 2: Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

# Step 3: Start
Write-Host "`n🚀 Step 3: Starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers!" -ForegroundColor Red
    exit 1
}

# Step 4: Wait
Write-Host "`n⏳ Step 4: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 5: Check status
Write-Host "`n🔍 Step 5: Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

# Step 6: Check health
Write-Host "`n🏥 Step 6: Health checks..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend is healthy!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend health check failed (might need more time)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URL: http://localhost" -ForegroundColor Cyan
Write-Host "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
Write-Host "🛑 Stop: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Cyan
Write-Host ""
