"use server";

import { unstable_cache } from "next/cache";

// ============================================================================
// Types
// ============================================================================

interface DriveImage {
  id: string;
  name: string;
  src: string;
  originalSrc: string;
  mimeType: string;
  width?: number;
  height?: number;
}

interface DriveImagesResult {
  images: DriveImage[];
  nextPageToken?: string;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ============================================================================
// Internal Fetcher
// ============================================================================

async function fetchDriveImages(
  folderId: string,
  pageToken?: string
): Promise<DriveImagesResult> {
  try {
    const url = new URL(`${API_URL}/api/drive-image/folder/${folderId}/images`);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }
    const res = await fetch(url.toString(), {
      next: { revalidate: 0 } // Cache is managed by unstable_cache for first page
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch images from API: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.error) {
       throw new Error(data.error);
    }
    return data.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching images from API:", message);
    return { images: [], error: message };
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Get images from a Google Drive folder.
 * First page is cached per folderId, subsequent pages are fetched fresh.
 */
export async function getDriveImages(
  folderId: string,
  pageToken?: string
): Promise<DriveImagesResult> {
  // Only cache the first page (critical for initial render performance)
  if (!pageToken) {
    return unstable_cache(
      () => fetchDriveImages(folderId),
      [`gallery-images-${folderId}`],
      {
        tags: ["gallery-images"],
        revalidate: 3600,
      }
    )();
  }

  return fetchDriveImages(folderId, pageToken);
}

/**
 * Count total images in a Google Drive folder.
 * Uses simple in-memory cache with 1-hour TTL per folderId.
 */
const countCache = new Map<string, { count: number; time: number }>();
const COUNT_CACHE_TTL = 3600 * 1000; // 1 hour

export async function getTotalImageCount(folderId: string): Promise<number> {
  // Check cache
  const cached = countCache.get(folderId);
  if (cached && Date.now() - cached.time < COUNT_CACHE_TTL) {
    return cached.count;
  }

  try {
    const res = await fetch(`${API_URL}/api/drive-image/folder/${folderId}/count`);
    if (!res.ok) {
      throw new Error(`Failed to count images: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    const total = data.data?.count || 0;
    countCache.set(folderId, { count: total, time: Date.now() });
    return total;
  } catch (error) {
    console.error("Error counting images:", error);
    return 0;
  }
}
