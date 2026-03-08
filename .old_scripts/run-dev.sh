#!/bin/bash

# =============================================================================
# 🧪 Face Service — Dev Mode
# Starts Qdrant (Docker) + Python Face Service for local development
# Run from: gallery root or face-service directory
# =============================================================================

set -e

# Navigate to face-service directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACE_DIR="$SCRIPT_DIR/face-service"

if [ ! -d "$FACE_DIR" ]; then
    echo "❌ face-service directory not found at $FACE_DIR"
    exit 1
fi

cd "$FACE_DIR"

echo "🔍 Face Service — Dev Mode"
echo "=========================="

# ──────────────────────────────────────────────
# 1. Start Qdrant (Docker)
# ──────────────────────────────────────────────
echo ""
echo "📦 Starting Qdrant..."
if command -v docker &> /dev/null; then
    docker compose up qdrant -d
    echo "   ✅ Qdrant running on port 6333"
else
    echo "   ⚠️  Docker not found. Please install Docker and start Qdrant manually."
    echo "   Or run: docker run -d -p 6333:6333 qdrant/qdrant:latest"
fi

# ──────────────────────────────────────────────
# 2. Setup Python venv (if not exists)
# ──────────────────────────────────────────────
echo ""
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv || python -m venv venv
    echo "   ✅ Virtual environment created"
fi

# Activate venv
echo "🐍 Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# ──────────────────────────────────────────────
# 3. Install dependencies (if needed)
# ──────────────────────────────────────────────
if [ ! -f "venv/.deps_installed" ]; then
    echo "📥 Installing Python dependencies (this may take 5-10 minutes first time)..."
    pip install -r requirements.txt
    touch venv/.deps_installed
    echo "   ✅ Dependencies installed"
else
    echo "📥 Dependencies already installed (delete venv/.deps_installed to reinstall)"
fi

# ──────────────────────────────────────────────
# 4. Check .env
# ──────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  No .env file found! Creating from .env.example..."
    cp .env.example .env
    echo "   📝 Please edit face-service/.env with your actual credentials"
    echo "   Then re-run this script."
    exit 1
fi

# ──────────────────────────────────────────────
# 5. Start Face Service (with auto-reload)
# ──────────────────────────────────────────────
echo ""
echo "🚀 Starting Face Service on http://localhost:8000"
echo "📖 Swagger Docs: http://localhost:8000/docs"
echo "   Press Ctrl+C to stop"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload --workers 1
