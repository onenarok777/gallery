#!/bin/bash
# Migration script to convert the Gallery App into a Monorepo
# Run this script at the root of your project: d:\Development\ForMe\gallery
# WARNING: Please Ensure you have committed or backed up your code before running this!

echo "🚀 Starting Next.js to Monorepo Migration Process..."

# 1. Create directory structure
echo "📂 Creating apps/ and packages/ directories..."
mkdir -p apps/web
mkdir -p apps/api
mkdir -p apps/face-service
mkdir -p packages/ui
mkdir -p packages/config-eslint
mkdir -p packages/config-typescript

# 2. Move existing frontend files to apps/web
echo "🚚 Moving current Next.js application to apps/web..."
# Move standard Next.js files and folders
mv app components lib publicmodels scripts apps/web/ 2>/dev/null
mv next.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts tsconfig.json apps/web/ 2>/dev/null
mv package.json apps/web/package.json 2>/dev/null
mv package-lock.json apps/web/package-lock.json 2>/dev/null
# Keeping root files like README.md and .git in place!

# 3. Create Root Workspace package.json
echo "📦 Creating root workspace package.json..."
cat << 'EOF' > package.json
{
  "name": "gallery-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "start": "turbo run start"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
EOF

# 4. Create turbo.json
echo "⚡ Creating turbo.json for build orchestration..."
cat << 'EOF' > turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "dependsOn": ["build"]
    }
  }
}
EOF

# 5. Move UI components and config (Basic setup)
# (In a real scenario, you'd extract these from apps/web, but for now we'll just initialize them)
echo "🔧 Setting up shared packages..."
cat << 'EOF' > packages/ui/package.json
{
  "name": "@gallery/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./index.tsx"
}
EOF

cat << 'EOF' > packages/config-eslint/package.json
{
  "name": "@gallery/eslint-config",
  "version": "0.0.0",
  "private": true
}
EOF

cat << 'EOF' > packages/config-typescript/package.json
{
  "name": "@gallery/typescript-config",
  "version": "0.0.0",
  "private": true
}
EOF

# 6. Initialize Hono Backend in apps/api
echo "🔥 Initializing Hono backend in apps/api..."
cd apps/api
npm init -y
npm pkg set name="@gallery/api"
npm install hono @hono/node-server
npm install -D typescript @types/node tsx
mkdir -p src
cat << 'EOF' > src/index.ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Gallery API' })
})

// TODO: Migrate routes from apps/web/app/api here

const port = 4000
console.log(`API is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
EOF

# Update package.json scripts for Hono
npm pkg set scripts.dev="tsx watch src/index.ts"
npm pkg set scripts.start="node dist/index.js"
cd ../../

# 7. Move face-service (Python)
echo "🐍 Moving face-service to apps/face-service..."
mv face-service/* apps/face-service/ 2>/dev/null
mv face-service/.* apps/face-service/ 2>/dev/null
rm -rf face-service

# 8. Create docker-compose.yml
echo "🐳 Creating root docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
version: '3.8'

networks:
  gallery_internal:
    driver: bridge

services:
  web:
    build: 
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - gallery_internal
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - INTERNAL_API_URL=http://api:4000
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    depends_on:
      - face-service
    networks:
      - gallery_internal
    environment:
      - FACE_SERVICE_URL=http://face-service:8000
    restart: unless-stopped

  face-service:
    build:
      context: ./apps/face-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - qdrant
    networks:
      - gallery_internal
    volumes:
      - publicmodels_data:/app/models
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    networks:
      - gallery_internal
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

volumes:
  qdrant_data:
  publicmodels_data:
EOF

# 9. Create Dockerfiles for Web and API
echo "📄 Creating Dockerfiles..."
cat << 'EOF' > apps/api/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We use tsx for dev, you'd compile to JS for proper prod
CMD ["npm", "run", "dev"]
EOF

cat << 'EOF' > apps/web/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
EOF

# Update face-service Dockerfile path (if it existed)
# Normally you just keep the same Dockerfile it already had

# 10. Install root dependencies
echo "📦 Installing root workspace dependencies (Turbo)..."
npm install

echo ""
echo "✅ ========================================================"
echo "✅ Migration Setup Complete!"
echo "✅ ========================================================"
echo "Next Steps to do MANUALLY:"
echo "1. Migrate Next.js API Routes: Move logic from apps/web/app/api to apps/api/src/index.ts"
echo "2. Check package.json in apps/web: Ensure it's correctly named, e.g., @gallery/web"
echo "3. Run your setup: try 'npm run dev' or 'docker-compose up -d --build'"
echo "⚠️  Note: You might need to adjust some tsconfig paths or imports."
echo ""
