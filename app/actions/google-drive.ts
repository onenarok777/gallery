"use server";

import { getAuthenticatedDrive } from "@/lib/google-auth";

export async function getDriveImages(searchQuery: string = "") {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    console.error("Missing GOOGLE_DRIVE_FOLDER_ID");
    return { images: [], error: "Missing Folder ID" };
  }

  try {
    const drive = getAuthenticatedDrive();

    let q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    if (searchQuery) {
      q += ` and (name contains '${searchQuery}' or fullText contains '${searchQuery}')`;
    }

    const response = await drive.files.list({
      q,
      fields: "files(id, name, mimeType, imageMediaMetadata, thumbnailLink)",
      orderBy: "modifiedTime",
      pageSize: 100,
    });

    const files = response.data.files;
    if (!files) return { images: [] };

    // Use proxy with caching for thumbnails to avoid Google rate limits
    const images = files.map((file) => {
      // Encode thumbnailLink and pass it to proxy - avoids extra API call!
      const thumbUrl = file.thumbnailLink 
        ? file.thumbnailLink.replace(/=s\d+/, "=s600") 
        : "";
      const previewSrc = `/api/drive-image/${file.id}?thumb=1&url=${encodeURIComponent(thumbUrl)}`;
      const originalSrc = `/api/drive-image/${file.id}?name=${encodeURIComponent(file.name || "image.jpg")}`;
      
      return {
        id: file.id,
        name: file.name,
        src: previewSrc,           // Grid uses proxy (with server cache)
        originalSrc: originalSrc,  // Lightbox uses proxy for original
        mimeType: file.mimeType,
        width: file.imageMediaMetadata?.width,
        height: file.imageMediaMetadata?.height,
      };
    });
    
    return { images };

  } catch (error: any) {
    console.error("Error fetching images from Drive:", error?.message || error);
    return { images: [], error: error?.message || "Unknown error" };
  }
}
