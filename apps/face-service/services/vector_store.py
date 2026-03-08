"""
Qdrant Vector Store Client

Manages face embedding storage and similarity search.
Collection: face_embeddings (128-d Facenet vectors, Cosine distance)
"""
import logging
import uuid
from datetime import datetime, timezone
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    ScrollRequest,
)

logger = logging.getLogger(__name__)

COLLECTION_NAME = "face_embeddings"
VECTOR_SIZE = 128  # Facenet model output dimension


class VectorStore:
    def __init__(self, host: str = "localhost", port: int = 6333):
        self.client = QdrantClient(host=host, port=port, timeout=30)
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == COLLECTION_NAME for c in collections)

            if not exists:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=VECTOR_SIZE,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created collection '{COLLECTION_NAME}' ({VECTOR_SIZE}-d, Cosine)")
            else:
                logger.info(f"Collection '{COLLECTION_NAME}' already exists")

        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
            raise

    def is_connected(self) -> bool:
        """Check if Qdrant is reachable"""
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

    def get_total_count(self) -> int:
        """Get total number of indexed face vectors"""
        try:
            info = self.client.get_collection(COLLECTION_NAME)
            return info.points_count or 0
        except Exception:
            return 0

    def is_image_indexed(self, drive_image_id: str) -> bool:
        """Check if an image has already been indexed"""
        try:
            result = self.client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="drive_image_id",
                            match=MatchValue(value=drive_image_id),
                        )
                    ]
                ),
                limit=1,
            )
            return len(result[0]) > 0
        except Exception:
            return False

    def index_face(
        self,
        embedding: list[float],
        drive_image_id: str,
        image_name: str,
        face_index: int,
        bbox: dict,
    ) -> str:
        """
        Store a face embedding in Qdrant.
        
        Returns:
            The UUID of the stored point
        """
        point_id = str(uuid.uuid4())

        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "drive_image_id": drive_image_id,
                        "image_name": image_name,
                        "face_index": face_index,
                        "bbox": bbox,
                        "indexed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )

        logger.info(f"Indexed face {face_index} from image {drive_image_id}")
        return point_id

    def search_similar(
        self,
        query_embedding: list[float],
        limit: int = 20,
        score_threshold: float = 0.6,
    ) -> list[dict]:
        """
        Search for similar faces using cosine similarity.
        
        Returns:
            List of dicts: drive_image_id, image_name, score, face_bbox
        """
        results = self.client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=limit,
            score_threshold=score_threshold,
        )

        # Deduplicate by drive_image_id (keep highest score per image)
        seen = {}
        for hit in results:
            img_id = hit.payload.get("drive_image_id", "")
            score = hit.score

            if img_id not in seen or score > seen[img_id]["score"]:
                seen[img_id] = {
                    "drive_image_id": img_id,
                    "image_name": hit.payload.get("image_name", ""),
                    "score": round(float(score), 4),
                    "face_bbox": hit.payload.get("bbox"),
                }

        # Sort by score descending
        return sorted(seen.values(), key=lambda x: x["score"], reverse=True)

    def delete_by_image_id(self, drive_image_id: str) -> int:
        """Delete all face embeddings for a specific image"""
        try:
            self.client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="drive_image_id",
                            match=MatchValue(value=drive_image_id),
                        )
                    ]
                ),
            )
            logger.info(f"Deleted embeddings for image {drive_image_id}")
            return 1
        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")
            return 0

    def get_all_indexed_image_ids(self) -> set[str]:
        """Get all unique drive_image_ids that have been indexed"""
        indexed_ids = set()
        offset = None

        while True:
            result = self.client.scroll(
                collection_name=COLLECTION_NAME,
                limit=1000,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            points, next_offset = result

            for point in points:
                img_id = point.payload.get("drive_image_id")
                if img_id:
                    indexed_ids.add(img_id)

            if next_offset is None:
                break
            offset = next_offset

        return indexed_ids
