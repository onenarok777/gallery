"""
API Router: Face Search

POST /api/search-face — Upload a photo to find similar faces
"""
import logging
from fastapi import APIRouter, UploadFile, File, Query, HTTPException

from models.schemas import SearchResponse, SearchResult, BoundingBox
from services.face_engine import extract_embeddings
from services.vector_store import VectorStore

logger = logging.getLogger(__name__)
router = APIRouter()

# Will be set by main.py
vector_store: VectorStore | None = None


@router.post("/api/search-face", response_model=SearchResponse)
async def search_face(
    file: UploadFile = File(..., description="Photo to search with (selfie)"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
    threshold: float = Query(0.6, ge=0.0, le=1.0, description="Similarity threshold"),
):
    """
    Upload a photo → extract face embedding → search for similar faces in the gallery.
    Returns matched images sorted by similarity score.
    """
    if not vector_store:
        raise HTTPException(status_code=503, detail="Qdrant ไม่ได้เชื่อมต่อ — กรุณาเริ่ม Qdrant ก่อน (docker compose up qdrant -d)")

    image_bytes = await file.read()

    # Extract face embeddings from the uploaded photo
    face_data = extract_embeddings(image_bytes)

    if not face_data:
        return SearchResponse(
            query_faces_count=0,
            results=[],
            threshold=threshold,
        )

    # Use the first (most prominent) face for searching
    query_embedding = face_data[0]["embedding"]

    # Search Qdrant
    raw_results = vector_store.search_similar(
        query_embedding=query_embedding,
        limit=limit,
        score_threshold=threshold,
    )

    # Map to response model
    results = [
        SearchResult(
            drive_image_id=r["drive_image_id"],
            image_name=r["image_name"],
            score=r["score"],
            face_bbox=BoundingBox(**r["face_bbox"]) if r.get("face_bbox") else None,
        )
        for r in raw_results
    ]

    return SearchResponse(
        query_faces_count=len(face_data),
        results=results,
        threshold=threshold,
    )
