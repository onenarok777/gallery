"""
Google Drive Sync Service

Fetches images from Google Drive using Service Account credentials.
Used for background indexing of face embeddings.
"""
import io
import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

logger = logging.getLogger(__name__)


def _get_drive_service():
    """Create authenticated Google Drive service"""
    email = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    private_key = os.getenv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "")

    if not email or not private_key:
        raise ValueError("Missing Google Service Account credentials")

    # Handle escaped newlines from env
    private_key = private_key.replace("\\n", "\n")

    credentials = service_account.Credentials.from_service_account_info(
        {
            "type": "service_account",
            "client_email": email,
            "private_key": private_key,
            "token_uri": "https://oauth2.googleapis.com/token",
        },
        scopes=["https://www.googleapis.com/auth/drive.readonly"],
    )

    return build("drive", "v3", credentials=credentials)


def list_drive_images(folder_id: str, page_size: int = 100) -> list[dict]:
    """
    List all images from a Google Drive folder.
    
    Returns:
        List of dicts: id, name, mimeType
    """
    service = _get_drive_service()
    all_images = []
    page_token = None

    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"

    while True:
        response = (
            service.files()
            .list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType)",
                pageSize=page_size,
                pageToken=page_token,
                orderBy="modifiedTime desc",
            )
            .execute()
        )

        files = response.get("files", [])
        all_images.extend(
            {"id": f["id"], "name": f["name"], "mimeType": f["mimeType"]}
            for f in files
        )

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    logger.info(f"Found {len(all_images)} images in Drive folder {folder_id}")
    return all_images


def download_image(file_id: str) -> bytes:
    """
    Download an image from Google Drive by file ID.
    
    Returns:
        Image bytes
    """
    service = _get_drive_service()

    request = service.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    buffer.seek(0)
    return buffer.read()
