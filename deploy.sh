#!/bin/bash

# Stop on any error
set -e

echo "🚀 Starting Deployment for Gallery App..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# 2. Install dependencies
echo "📦 Installing NPM dependencies..."
npm install

# 3. Build the application
echo "🏗️  Building Next.js application..."
npm run build

# 4. Restart PM2 process
echo "🔄 Restarting PM2..."
# Try to restart, if fails (not running), then start
pm2 restart gallery-app 2>/dev/null || pm2 start ecosystem.config.js

# 5. Save PM2 list
pm2 save

echo "✅ Deployment Complete! App is running."
