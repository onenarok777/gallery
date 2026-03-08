#!/bin/bash
# Script to clean up old unused files after the Monorepo migration.
# This will keep your root directory clean for the new Turborepo + Docker Compose setup.

echo "🧹 Starting root directory cleanup..."

# 1. Backing up old deployment/run scripts just in case
echo "📦 Backing up old scripts to .old_scripts (in case you still need PM2 or custom deploy logic)..."
mkdir -p .old_scripts
mv deploy.sh .old_scripts/ 2>/dev/null
mv run-deploy.sh .old_scripts/ 2>/dev/null
mv run-dev.sh .old_scripts/ 2>/dev/null
mv start.sh .old_scripts/ 2>/dev/null
mv ecosystem.config.js .old_scripts/ 2>/dev/null

# 2. Moving Next.js specific files that were left in root to apps/web
echo "🚚 Moving leftover Next.js specific configs to apps/web..."
mv vercel.json apps/web/vercel.json 2>/dev/null
mv preinstall.js apps/web/preinstall.js 2>/dev/null

# 3. Deleting old build caches and unnecessary root folders
echo "🗑️ Deleting old Next.js build cache (.next) from root..."
rm -rf .next

echo "✅ =========================================="
echo "✅ Cleanup Complete!"
echo "✅ =========================================="
echo "Your root folder is now clean!"
echo "If you ever need your old PM2 scripts or deploy files, they are safely stored in the '.old_scripts/' folder."
ls -la
