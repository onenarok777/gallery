"""
API Router: Face Detection

POST /api/detect-faces — Detect faces in an image and return bounding boxes
"""
import logging
from fastapi import APIRouter, UploadFile, File

from models.schemas import DetectResponse, FaceDetection, BoundingBox
from services.face_engine import detect_faces

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/detect-faces", response_model=DetectResponse)
async def detect_faces_endpoint(
    file: UploadFile = File(..., description="Image to detect faces in"),
):
    """
    Upload an image → detect all faces → return bounding boxes & confidence.
    """
    image_bytes = await file.read()
    faces = detect_faces(image_bytes)

    return DetectResponse(
        faces_count=len(faces),
        faces=[
            FaceDetection(
                face_index=f["face_index"],
                bbox=BoundingBox(**f["bbox"]),
                confidence=f["confidence"],
            )
            for f in faces
        ],
    )
