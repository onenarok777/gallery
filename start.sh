#!/bin/bash

# Stop on any error
set -e

# ==============================================================================
# Configuration
# ==============================================================================
APP_NAME="gallery-app"

echo "🚀 Starting Full Deployment for $APP_NAME..."

# ==============================================================================
# 0. Memory Check & Cleanup (Crucial for Small VPS)
# ==============================================================================
echo "🧹 freeing up memory for build process..."
# Stop the app temporarily to free up RAM for the build
pm2 stop "$APP_NAME" 2>/dev/null || true

# ==============================================================================
# 1. Update Code & Dependencies
# ==============================================================================
echo "📥 Pulling latest changes from git..."
git pull

echo "📦 Installing NPM dependencies..."
npm install --production=false

echo "🏗️  Building Next.js application..."
# Use max-old-space-size to prevent node from grabbing too much and getting killed
export NODE_OPTIONS="--max-old-space-size=2048" 
npm run build

# ==============================================================================
# 2. Manage PM2 Process
# ==============================================================================
echo "🔄 Managing PM2 process..."

# Use existing startup config or start fresh
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
    echo "   Refreshed existing process."
else
    pm2 start ecosystem.config.js
    echo "   Started new process."
fi

# Save config so it auto-starts on reboot
pm2 save
echo "   PM2 configuration saved."

# ==============================================================================
# 3. Setup Cron Job (Auto-Cache Refresh)
# ==============================================================================
echo "⏰ Configuring Cron Job..."

if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found. Skipping Cron setup."
else
  CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)
  PORT=$(grep PORT .env | cut -d '=' -f2)
  PORT=${PORT:-3000} # Default to 3000 if not set

  if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  Warning: CRON_SECRET not found in .env. Skipping Cron setup."
  else
    # Command: Run every 1 minute (Light mode by default)
    CRON_CMD="*/1 * * * * curl -s http://localhost:$PORT/api/cron/refresh-images?secret=$CRON_SECRET >/dev/null 2>&1"

    # Update crontab safely (remove old entry, add new one)
    (crontab -l 2>/dev/null | grep -v "/api/cron/refresh-images"; echo "$CRON_CMD") | crontab -
    
    echo "   ✅ Cron job set to run every 1 minute (Light Mode)."
  fi
fi

echo ""
echo "✨ All Systems Go! Deployment Finished Successfully."
echo "   - App is running on PM2 ($APP_NAME)"
echo "   - Cron job is active"
