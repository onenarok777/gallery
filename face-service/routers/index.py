"""
API Router: Image Indexing

POST /api/index-image — Index a single image from Google Drive
POST /api/reindex    — Re-index all images from Google Drive (background)
"""
import os
import logging
import threading
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException

from models.schemas import IndexResponse, ReindexResponse
from services.vector_store import VectorStore
from worker.indexer import index_single_image, run_indexing
from services.drive_sync import download_image

logger = logging.getLogger(__name__)
router = APIRouter()

# Will be set by main.py
vector_store: VectorStore | None = None

# Lock to prevent concurrent re-indexing
_reindex_lock = threading.Lock()
_reindex_running = False


@router.post("/api/index-image", response_model=IndexResponse)
async def index_image_endpoint(
    drive_image_id: str = Form(..., description="Google Drive file ID"),
    image_name: str = Form("unknown.jpg", description="Image filename"),
    file: UploadFile | None = File(None, description="Optional: image file (if not provided, downloads from Drive)"),
):
    """
    Index a single image's faces into the vector database.
    Can either upload the image directly or provide a Drive file ID to download.
    """
    if not vector_store:
        raise HTTPException(status_code=503, detail="Qdrant ไม่ได้เชื่อมต่อ — กรุณาเริ่ม Qdrant ก่อน")

    image_bytes = None
    if file:
        image_bytes = await file.read()

    faces_count = index_single_image(
        vector_store=vector_store,
        drive_image_id=drive_image_id,
        image_name=image_name,
        image_bytes=image_bytes,
    )

    return IndexResponse(
        drive_image_id=drive_image_id,
        faces_indexed=faces_count,
        message=f"Indexed {faces_count} face(s)" if faces_count > 0 else "No faces found or already indexed",
    )


@router.post("/api/reindex", response_model=ReindexResponse)
async def reindex_endpoint(background_tasks: BackgroundTasks):
    """
    Trigger a full re-index of all images from Google Drive.
    Runs in background to avoid timeout. Skips already-indexed images.
    """
    global _reindex_running

    if _reindex_running:
        return ReindexResponse(
            total_images=0,
            total_faces_indexed=0,
            skipped=0,
            errors=0,
            message="Re-indexing is already in progress. Please wait.",
        )

    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not folder_id:
        return ReindexResponse(
            total_images=0,
            total_faces_indexed=0,
            skipped=0,
            errors=0,
            message="Missing GOOGLE_DRIVE_FOLDER_ID",
        )

    def _run_in_background():
        global _reindex_running
        _reindex_running = True
        try:
            run_indexing(vector_store=vector_store, folder_id=folder_id)
        except Exception as e:
            logger.error(f"Background reindex failed: {e}")
        finally:
            _reindex_running = False

    background_tasks.add_task(_run_in_background)

    return ReindexResponse(
        total_images=0,
        total_faces_indexed=0,
        skipped=0,
        errors=0,
        message="Re-indexing started in background. Check logs for progress.",
    )
