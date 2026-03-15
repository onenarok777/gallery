"""
Background Indexer Worker

Crawls Google Drive images, extracts face embeddings, 
and stores them in Qdrant. Supports incremental indexing.
"""
import time
import logging
from services.face_engine import extract_embeddings
from services.vector_store import VectorStore
from services.drive_sync import list_drive_images, download_image

logger = logging.getLogger(__name__)


def run_indexing(
    vector_store: VectorStore,
    folder_id: str,
    delay_seconds: float = 2.0,
) -> dict:
    """
    Index all un-indexed images from Google Drive.
    
    Args:
        vector_store: Qdrant vector store instance
        folder_id: Google Drive folder ID (required)
        delay_seconds: Delay between processing each image (RAM protection)
    
    Returns:
        Stats dict: total_images, total_faces_indexed, skipped, errors
    """
    if not folder_id:
        logger.warning("No folder_id provided, skipping.")
        return {"total_images": 0, "total_faces_indexed": 0, "skipped": 0, "errors": 0}

    stats = {
        "total_images": 0,
        "total_faces_indexed": 0,
        "skipped": 0,
        "errors": 0,
    }

    try:
        # Get all images from Drive
        images = list_drive_images(folder_id)
        stats["total_images"] = len(images)

        # Get already-indexed image IDs
        indexed_ids = vector_store.get_all_indexed_image_ids()
        logger.info(f"Already indexed: {len(indexed_ids)} images")

        for i, img in enumerate(images):
            image_id = img["id"]
            image_name = img["name"]

            # Skip already indexed
            if image_id in indexed_ids:
                stats["skipped"] += 1
                continue

            logger.info(f"[{i+1}/{len(images)}] Processing: {image_name}")

            try:
                # Download image
                image_bytes = download_image(image_id)

                # Extract face embeddings
                face_data = extract_embeddings(image_bytes)

                if not face_data:
                    logger.info(f"  No faces found in {image_name}")
                    continue

                # Store each face embedding
                for face in face_data:
                    vector_store.index_face(
                        embedding=face["embedding"],
                        drive_image_id=image_id,
                        image_name=image_name,
                        face_index=face["face_index"],
                        bbox=face["bbox"],
                    )
                    stats["total_faces_indexed"] += 1

                logger.info(f"  Indexed {len(face_data)} face(s) from {image_name}")

            except Exception as e:
                logger.error(f"  Error processing {image_name}: {e}")
                stats["errors"] += 1

            # Delay to prevent RAM spike (important for 4GB servers)
            time.sleep(delay_seconds)

    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        raise

    logger.info(
        f"Indexing complete: {stats['total_faces_indexed']} faces "
        f"from {stats['total_images']} images "
        f"({stats['skipped']} skipped, {stats['errors']} errors)"
    )
    return stats


def index_single_image(
    vector_store: VectorStore,
    drive_image_id: str,
    image_name: str,
    image_bytes: bytes | None = None,
) -> int:
    """
    Index a single image. Downloads from Drive if image_bytes not provided.
    
    Returns:
        Number of faces indexed
    """
    # Skip if already indexed
    if vector_store.is_image_indexed(drive_image_id):
        logger.info(f"Image {drive_image_id} already indexed, skipping")
        return 0

    # Download if not provided
    if image_bytes is None:
        image_bytes = download_image(drive_image_id)

    # Extract embeddings
    face_data = extract_embeddings(image_bytes)

    if not face_data:
        logger.info(f"No faces found in {image_name}")
        return 0

    # Store each face
    for face in face_data:
        vector_store.index_face(
            embedding=face["embedding"],
            drive_image_id=drive_image_id,
            image_name=image_name,
            face_index=face["face_index"],
            bbox=face["bbox"],
        )

    logger.info(f"Indexed {len(face_data)} face(s) from {image_name}")
    return len(face_data)
