#!/bin/bash

# Stop on error
set -e

# Load configuration from .env.deploy
if [ -f .env.deploy ]; then
  export $(grep -v '^#' .env.deploy | xargs)
fi

# Check required variables
if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_PATH" ]; then
  echo "❌ Error: Deployment configuration missing."
  echo "Please create a .env.deploy file in the project root with:"
  echo "SERVER_IP=your_server_ip"
  echo "SERVER_USER=your_username"
  echo "SERVER_PATH=/path/to/your/app"
  exit 1
fi

echo "🚀 Starting Deployment to $SERVER_IP..."

# 0. Ensure remote directory exists
echo "📁 Ensuring remote directory exists..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_PATH"

# 1. Build Locally
echo "🏗️  Building application locally..."
# We can skip linting here too if desired, but usually we want to know if it fails
npm run build

# 2. Sync Files to Server
echo "📤 Uploading files to server..."
# Using rsync to sync files (excluding heavy/sensitive ones)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.deploy' \
  --exclude '.next/cache' \
  --exclude '.DS_Store' \
  ./ "$SERVER_USER@$SERVER_IP:$SERVER_PATH"

# 3. Remote Commands (Install dependencies & Restart)
echo "🔄 Running remote commands..."
# Create a robust command that loads the user environment (for NVM/Node/PM2)
REMOTE_SCRIPT="
  export PATH=\$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
  [ -s \"\$HOME/.nvm/nvm.sh\" ] && . \"\$HOME/.nvm/nvm.sh\"  # Load NVM
  [ -s \"\$HOME/.profile\" ] && . \"\$HOME/.profile\"         # Load Profile
  [ -s \"\$HOME/.bashrc\" ] && . \"\$HOME/.bashrc\"           # Load Bashrc
  [ -s \"\$HOME/.zshrc\" ] && . \"\$HOME/.zshrc\"             # Load Zshrc
  
  cd $SERVER_PATH
  echo '📦 Installing dependencies...'
  npm install --omit=dev
  
  echo '🚀 Restarting PM2...'
  # Check if pm2 exists, if not warn
  if ! command -v pm2 &> /dev/null; then
      echo '⚠️  PM2 not found in PATH. Please ensure PM2 is installed on the server (npm install -g pm2).'
      exit 1
  fi

  (pm2 restart gallery-app 2>/dev/null || pm2 start ecosystem.config.js)
  pm2 save
  
  echo '⏰ Refreshing Cron...'
  chmod +x scripts/setup-cron.sh
  ./scripts/setup-cron.sh
"

ssh "$SERVER_USER@$SERVER_IP" "$REMOTE_SCRIPT"

echo "✅ Deployment Complete Successfully!"
