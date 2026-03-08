#!/bin/bash

# =============================================================================
# 🚀 Face Service — Production Deploy
# Deploys Qdrant + Face Service via Docker Compose on VPS
# Run from: gallery root directory on the server
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACE_DIR="$SCRIPT_DIR/face-service"
APP_NAME="gallery-app"

echo "🚀 Full Deploy — Gallery + Face Service"
echo "========================================"

# ──────────────────────────────────────────────
# 0. Swap Check (important for 4GB server)
# ──────────────────────────────────────────────
echo ""
echo "💾 Checking swap..."
SWAP_SIZE=$(free -m | awk '/Swap/ {print $2}')
if [ "$SWAP_SIZE" -lt 1024 ]; then
    echo "   ⚠️  Swap is ${SWAP_SIZE}MB (recommend 2GB+)"
    echo "   Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    # Persist on reboot
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "   ✅ 2GB swap created"
else
    echo "   ✅ Swap is ${SWAP_SIZE}MB (OK)"
fi

# ──────────────────────────────────────────────
# 1. Pull Latest Code
# ──────────────────────────────────────────────
echo ""
echo "📥 Pulling latest changes..."
git pull

# ──────────────────────────────────────────────
# 2. Deploy Face Service (Docker)
# ──────────────────────────────────────────────
echo ""
echo "🐍 Deploying Face Service..."
cd "$FACE_DIR"

if [ ! -f ".env" ]; then
    echo "   ⚠️  face-service/.env not found! Creating from example..."
    cp .env.example .env
    echo "   📝 IMPORTANT: Edit face-service/.env with your credentials"
    echo "   Then re-run this script."
    exit 1
fi

# Build and start containers
echo "   Building Docker images (first time may take 10-15 minutes)..."
docker compose build --no-cache face-service
echo "   Starting Qdrant + Face Service..."
docker compose up -d

# Wait for services to be ready
echo "   Waiting for services to start..."
sleep 5

# Health check
HEALTH=$(curl -s http://localhost:8000/api/health 2>/dev/null || echo '{"status":"error"}')
echo "   Health: $HEALTH"

cd "$SCRIPT_DIR"

# ──────────────────────────────────────────────
# 3. Deploy Next.js (PM2)
# ──────────────────────────────────────────────
echo ""
echo "🟢 Deploying Next.js..."

# Stop app to free RAM for build
pm2 stop "$APP_NAME" 2>/dev/null || true

echo "   📦 Installing NPM dependencies..."
npm install --production=false

echo "   🏗️  Building Next.js..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

# Start/restart PM2
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    pm2 start ecosystem.config.js
fi
pm2 save

# ──────────────────────────────────────────────
# 4. Index Faces (First Time Only)
# ──────────────────────────────────────────────
echo ""
API_KEY=$(grep API_KEY "$FACE_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
FACE_COUNT=$(curl -s http://localhost:8000/api/health 2>/dev/null | grep -o '"total_indexed_faces":[0-9]*' | cut -d':' -f2)

if [ "$FACE_COUNT" = "0" ] || [ -z "$FACE_COUNT" ]; then
    echo "🔍 No faces indexed yet. Starting background indexing..."
    curl -s -X POST http://localhost:8000/api/reindex \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" || true
    echo "   ✅ Indexing started in background (check logs: docker compose logs -f face-service)"
else
    echo "🔍 Already indexed $FACE_COUNT faces. Skipping reindex."
fi

# ──────────────────────────────────────────────
# Done!
# ──────────────────────────────────────────────
echo ""
echo "========================================"
echo "✨ Deploy Complete!"
echo ""
echo "   🟢 Next.js      → PM2 ($APP_NAME) :3000"
echo "   🐍 Face Service → Docker :8000"
echo "   📦 Qdrant       → Docker :6333"
echo "   📖 API Docs     → http://localhost:8000/docs"
echo ""
echo "   📋 Useful Commands:"
echo "   docker compose -f face-service/docker-compose.yml logs -f   # Face service logs"
echo "   pm2 logs $APP_NAME                                          # Next.js logs"
echo "   curl http://localhost:8000/api/health                       # Health check"
echo "========================================"
