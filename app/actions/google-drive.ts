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
      fields: "files(id, name, mimeType, imageMediaMetadata)",
      orderBy: "modifiedTime",
      pageSize: 100,
    });

    const files = response.data.files;
    if (!files) return { images: [] };

    // Use our proxy endpoint for all images
    const images = files.map((file) => {
      const previewSrc = `/api/drive-image/${file.id}?thumb=1`;
      const originalSrc = `/api/drive-image/${file.id}?name=${encodeURIComponent(file.name || "image.jpg")}`;
      
      return {
        id: file.id,
        name: file.name,
        src: previewSrc,           // Grid uses preview (thumbnail)
        originalSrc: originalSrc,  // Lightbox uses original
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
