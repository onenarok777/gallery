"""
Pydantic models for the Face Service API
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BoundingBox(BaseModel):
    """Face bounding box coordinates"""
    x: int
    y: int
    w: int
    h: int


class FaceDetection(BaseModel):
    """A single detected face in an image"""
    face_index: int
    bbox: BoundingBox
    confidence: float


class DetectResponse(BaseModel):
    """Response from /api/detect-faces"""
    faces_count: int
    faces: list[FaceDetection]


class SearchResult(BaseModel):
    """A single search result"""
    drive_image_id: str
    image_name: str
    score: float
    face_bbox: Optional[BoundingBox] = None


class SearchResponse(BaseModel):
    """Response from /api/search-face"""
    query_faces_count: int
    results: list[SearchResult]
    threshold: float


class IndexRequest(BaseModel):
    """Request to index a specific image"""
    drive_image_id: str
    image_name: str
    image_url: Optional[str] = None


class IndexResponse(BaseModel):
    """Response from /api/index-image"""
    drive_image_id: str
    faces_indexed: int
    message: str


class ReindexResponse(BaseModel):
    """Response from /api/reindex"""
    total_images: int
    total_faces_indexed: int
    skipped: int
    errors: int
    message: str


class HealthResponse(BaseModel):
    """Response from /api/health"""
    status: str
    qdrant_connected: bool
    model_loaded: bool
    total_indexed_faces: int
    uptime_seconds: float
