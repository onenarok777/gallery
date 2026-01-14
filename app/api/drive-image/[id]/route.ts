import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDrive } from "@/lib/google-auth";

// In-memory cache for images (cleared on server restart or by webhook)
const imageCache = new Map<string, { data: Uint8Array; contentType: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hour cache
const MAX_CACHE_SIZE = 200; // Max cached items

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new NextResponse("Missing File ID", { status: 400 });
  }

  try {
    const drive = getAuthenticatedDrive();
    const headers = new Headers();
    
    const cacheKey = `img_${id}`;
    
    // Check in-memory cache first
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      headers.set("Content-Type", cached.contentType);
      headers.set("Content-Length", cached.data.byteLength.toString());
      headers.set("X-Cache", "HIT");
      // Aggressive caching for Vercel Edge CDN (24 hours)
      headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400, max-age=31536000, immutable");
      return new NextResponse(cached.data.buffer.slice(cached.data.byteOffset, cached.data.byteOffset + cached.data.byteLength) as ArrayBuffer, { headers });
    }

    // Fetch original file from Google Drive
    const response = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const imageData = new Uint8Array(response.data as ArrayBuffer);
    const contentType = (response.headers["content-type"] || "image/jpeg").toString();

    // Set response headers
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", imageData.byteLength.toString());
    headers.set("X-Cache", "MISS");
    
    // Aggressive caching for Vercel Edge CDN (24 hours)
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400, max-age=31536000, immutable");
    
    // Set filename for "Save As" dialog
    const name = request.nextUrl.searchParams.get("name") || "image.jpg";
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(name)}"`);

    // Store in cache (with size limit)
    if (imageCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 20; i++) {
        imageCache.delete(entries[i][0]);
      }
    }
    imageCache.set(cacheKey, { data: imageData, contentType, timestamp: Date.now() });

    return new NextResponse(imageData.buffer.slice(imageData.byteOffset, imageData.byteOffset + imageData.byteLength) as ArrayBuffer, { headers });

  } catch (error: any) {
    console.error("Error serving Drive image:", error?.message || error);
    
    if (error?.code === 404) {
      return new NextResponse("File not found", { status: 404 });
    }
    
    return new NextResponse("Error serving image", { status: 500 });
  }
}

// Export cache for clearing from webhook
export function clearImageCache() {
  imageCache.clear();
  console.log("Image cache cleared");
}
