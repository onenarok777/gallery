"use server";

import { google } from "googleapis";

export async function getDriveImages(searchQuery: string = "") {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId || !apiKey) {
    console.error("Missing Google Drive environment variables");
    console.log("DEBUG: FOLDER_ID:", folderId, "API_KEY length:", apiKey?.length);
    console.log("DEBUG: All Env Keys:", Object.keys(process.env).filter(k => k.startsWith("GOOGLE_")));
    return { images: [], error: "Missing Environment Variables" };
  }

  try {
    const drive = google.drive({ version: "v3", auth: apiKey });

    let q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    if (searchQuery) {
      // Search by name or content (fullText covers OCR and objects)
      q += ` and (name contains '${searchQuery}' or fullText contains '${searchQuery}')`;
    }

    const response = await drive.files.list({
      q,
      fields: "files(id, name, thumbnailLink, webContentLink, mimeType)",
      pageSize: 100, // Adjust as needed
    });

    const files = response.data.files;

    if (!files) return { images: [] };

    // Transform to a friendlier format if needed, or return as is
    const images = files.map((file) => {
      const thumb = file.thumbnailLink;
      // 's1024' for preview, 's0' for high-res original
      const previewSrc = thumb ? thumb.replace(/=s\d+$/, "=s1024") : "";
      const originalSrc = thumb ? thumb.replace(/=s\d+$/, "=s0") : file.webContentLink;

      // Fallback: If no thumbnail provided by API, try explicit thumbnail endpoint via proxy
      // This handles cases where Drive API doesn't return thumbnailLink but the file is an image
      const fallbackUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1024`;
      const finalSrc = previewSrc || `/api/proxy-image?url=${encodeURIComponent(fallbackUrl)}`;

      return {
        id: file.id,
        name: file.name,
        src: finalSrc,
        originalLink: originalSrc, // Client will try direct load, or we can use proxy logic there too if needed
        mimeType: file.mimeType,
      };
    });
    
    return { images };

  } catch (error: any) {
    console.error("Error fetching images from Drive:", error);
    // Extract more specific error message from Google API error if possible
    const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error occurred";
    return { images: [], error: errorMessage };
  }
}
