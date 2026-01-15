"use server";

import { getAuthenticatedDrive } from "@/lib/google-auth";

export async function getDriveImages(pageToken?: string) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    console.error("Missing GOOGLE_DRIVE_FOLDER_ID");
    return { images: [], error: "Missing Folder ID" };
  }

  try {
    const drive = getAuthenticatedDrive();

    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;

    const response: any = await drive.files.list({
      q,
      fields: "nextPageToken, files(id, name, mimeType, imageMediaMetadata, thumbnailLink)",
      orderBy: "modifiedTime desc", // Newest first
      pageSize: 50, // Load 50 at a time for infinite scroll
      pageToken: pageToken,
    });

    const files = response.data.files;
    const nextPageToken = response.data.nextPageToken;

    if (!files) return { images: [], nextPageToken: undefined };

    // Use original images for everything (cached on Vercel Edge CDN)
    const images = files.map((file: any) => {
      const imageSrc = `/api/drive-image/${file.id}?name=${encodeURIComponent(file.name || "image.jpg")}`;
      
      return {
        id: file.id,
        name: file.name,
        src: imageSrc,             // Grid uses original
        originalSrc: imageSrc,     // Lightbox uses original
        mimeType: file.mimeType,
        width: file.imageMediaMetadata?.width,
        height: file.imageMediaMetadata?.height,
      };
    });
    
    return { images, nextPageToken };

  } catch (error: any) {
    console.error("Error fetching images from Drive:", error?.message || error);
    return { images: [], error: error?.message || "Unknown error" };
  }
}

// Simple in-memory cache for total count
let cachedTotalCount: number | null = null;
let lastCountTime = 0;
const COUNT_CACHE_TTL = 3600 * 1000; // 1 hour

export async function getTotalImageCount() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) return 0;

  // Use cache if available and fresh
  if (cachedTotalCount !== null && (Date.now() - lastCountTime < COUNT_CACHE_TTL)) {
    return cachedTotalCount;
  }

  try {
    const drive = getAuthenticatedDrive();
    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    
    let total = 0;
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await drive.files.list({
        q,
        fields: "nextPageToken, files(id)", // Only fetch IDs for speed
        pageSize: 1000, // Max page size for faster counting
        pageToken: pageToken,
      });

      const files = response.data.files;
      if (files) {
        total += files.length;
      }
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    // Update cache
    cachedTotalCount = total;
    lastCountTime = Date.now();

    return total;
  } catch (error) {
    console.error("Error counting images:", error);
    return 0;
  }
}
