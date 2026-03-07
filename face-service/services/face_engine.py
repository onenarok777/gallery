"""
Face Detection & Embedding Engine using DeepFace

Uses Facenet model (128-d embeddings) for optimal RAM usage on 4GB servers.
"""
import io
import logging
import numpy as np
from PIL import Image
from deepface import DeepFace

logger = logging.getLogger(__name__)

# Global state for lazy loading
_model_loaded = False


def _ensure_model_loaded():
    """
    Lazy-load the face model on first use.
    DeepFace downloads and caches models automatically.
    """
    global _model_loaded
    if not _model_loaded:
        logger.info("Loading face model (Facenet)... This may take a moment on first run.")
        try:
            # Warm up - this triggers model download & load
            dummy = np.zeros((50, 50, 3), dtype=np.uint8)
            DeepFace.represent(
                img_path=dummy,
                model_name="Facenet",
                detector_backend="opencv",
                enforce_detection=False,
            )
            _model_loaded = True
            logger.info("Face model loaded successfully.")
        except Exception as e:
            logger.warning(f"Model warm-up had an issue (may still work): {e}")
            _model_loaded = True  # Mark as loaded anyway, DeepFace handles caching


def is_model_loaded() -> bool:
    return _model_loaded


def detect_faces(image_bytes: bytes) -> list[dict]:
    """
    Detect faces in an image and return bounding boxes + confidence.
    
    Returns:
        List of dicts with keys: face_index, bbox {x,y,w,h}, confidence
    """
    _ensure_model_loaded()

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        faces = DeepFace.extract_faces(
            img_path=img_array,
            detector_backend="opencv",
            enforce_detection=False,
            align=True,
        )

        results = []
        for i, face in enumerate(faces):
            region = face.get("facial_area", {})
            confidence = face.get("confidence", 0)

            # Skip low-confidence detections (likely false positives)
            if confidence < 0.5:
                continue

            results.append({
                "face_index": i,
                "bbox": {
                    "x": int(region.get("x", 0)),
                    "y": int(region.get("y", 0)),
                    "w": int(region.get("w", 0)),
                    "h": int(region.get("h", 0)),
                },
                "confidence": float(confidence),
            })

        return results

    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        return []


def extract_embeddings(image_bytes: bytes) -> list[dict]:
    """
    Extract face embeddings from an image.
    
    Returns:
        List of dicts with keys: face_index, embedding (list[float]), bbox {x,y,w,h}
    """
    _ensure_model_loaded()

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        representations = DeepFace.represent(
            img_path=img_array,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False,
            align=True,
        )

        results = []
        for i, rep in enumerate(representations):
            embedding = rep.get("embedding", [])
            region = rep.get("facial_area", {})

            if not embedding:
                continue

            results.append({
                "face_index": i,
                "embedding": embedding,  # 128-d float list
                "bbox": {
                    "x": int(region.get("x", 0)),
                    "y": int(region.get("y", 0)),
                    "w": int(region.get("w", 0)),
                    "h": int(region.get("h", 0)),
                },
            })

        return results

    except Exception as e:
        logger.error(f"Embedding extraction failed: {e}")
        return []
