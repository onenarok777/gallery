"""
Face Service — FastAPI Microservice for Face Recognition

Endpoints:
  POST /api/detect-faces  — Detect faces in an image
  POST /api/search-face   — Search gallery by face similarity
  POST /api/index-image   — Index a single image's faces
  POST /api/reindex       — Re-index all Drive images (background)
  GET  /api/health        — Health check
"""
import os
import time
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from services.vector_store import VectorStore
from services.face_engine import is_model_loaded
from routers import search, detect, index
from models.schemas import HealthResponse

# Load env
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Track startup time
START_TIME = time.time()

# Global vector store instance
vector_store: VectorStore | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle"""
    global vector_store

    # Startup
    logger.info("Starting Face Service...")

    qdrant_host = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))

    try:
        vector_store = VectorStore(host=qdrant_host, port=qdrant_port)
        logger.info(f"Connected to Qdrant at {qdrant_host}:{qdrant_port}")
    except Exception as e:
        logger.error(f"Failed to connect to Qdrant: {e}")
        logger.warning("Service will start but search/index features won't work")

    # Inject vector_store into routers
    search.vector_store = vector_store
    index.vector_store = vector_store

    yield

    # Shutdown
    logger.info("Shutting down Face Service...")


# Create FastAPI app
app = FastAPI(
    title="Face Service",
    description="Face recognition microservice for Gallery App",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("NEXTJS_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Key middleware (simple security)
API_KEY = os.getenv("API_KEY")


@app.middleware("http")
async def check_api_key(request: Request, call_next):
    """Optional API key check for inter-service communication"""
    # Skip health check
    if request.url.path == "/api/health":
        return await call_next(request)

    # Skip if no API key is configured
    if not API_KEY:
        return await call_next(request)

    # Check API key from header
    request_key = request.headers.get("X-API-Key", "")
    if request_key != API_KEY:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing API key"},
        )

    return await call_next(request)


# Register routers
app.include_router(search.router, tags=["Search"])
app.include_router(detect.router, tags=["Detect"])
app.include_router(index.router, tags=["Index"])


# Health check
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health, Qdrant connection, and model status"""
    qdrant_ok = vector_store.is_connected() if vector_store else False
    total_faces = vector_store.get_total_count() if vector_store else 0

    return HealthResponse(
        status="ok" if qdrant_ok else "degraded",
        qdrant_connected=qdrant_ok,
        model_loaded=is_model_loaded(),
        total_indexed_faces=total_faces,
        uptime_seconds=round(time.time() - START_TIME, 1),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        workers=1,  # Single worker for 4GB RAM
        reload=False,
    )
