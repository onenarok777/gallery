#!/bin/bash

# Configuration
APP_DIR=$(pwd)
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)
PORT=$(grep PORT .env | cut -d '=' -f2)
PORT=${PORT:-3000} # Default to 3000 if not set

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not found in .env file."
  echo "Please set CRON_SECRET=... in your .env file first."
  exit 1
fi

# The command to run (using curl to hit the local API)
# Runs EVERY MINUTE (*/1) - Light mode by default (Does not clear disk cache)
CRON_CMD="*/1 * * * * curl -s http://localhost:$PORT/api/cron/refresh-images?secret=$CRON_SECRET >/dev/null 2>&1"

# Check if job already exists to avoid duplicates
(crontab -l | grep -F "/api/cron/refresh-images") && echo "Cron job already exists. Updating..." 
# Remove old job and add new one
(crontab -l 2>/dev/null | grep -v "/api/cron/refresh-images"; echo "$CRON_CMD") | crontab -

echo "✅ Cron job updated successfully!"
echo "   Command: $CRON_CMD"
echo "   Schedule: Every 1 minute (Light Mode)"
echo "   Note: This will check for NEW images every minute without deleting downloaded cache."
