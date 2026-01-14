import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDrive } from "@/lib/google-auth";
import { Readable } from "stream";

// In-memory cache for thumbnails (cleared on server restart)
const thumbnailCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
const MAX_CACHE_SIZE = 500; // Max cached items

// Convert Node.js Readable to Web ReadableStream
async function* nodeStreamToIterator(stream: Readable) {
  for await (const chunk of stream) {
    yield chunk;
  }
}

function iteratorToStream(iterator: AsyncGenerator) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isThumbnail = request.nextUrl.searchParams.get("thumb") === "1";

  if (!id) {
    return new NextResponse("Missing File ID", { status: 400 });
  }

  try {
    const drive = getAuthenticatedDrive();
    const headers = new Headers();
    
    // Aggressive caching (1 year)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    if (isThumbnail) {
      const cacheKey = `thumb_${id}`;
      
      // Check in-memory cache first
      const cached = thumbnailCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        headers.set("Content-Type", cached.contentType);
        headers.set("X-Cache", "HIT");
        return new NextResponse(cached.data, { headers });
      }

      // Get thumbnailLink from query parameter (passed from getDriveImages)
      // This avoids an extra API call to drive.files.get!
      let thumbnailUrl = request.nextUrl.searchParams.get("url");
      
      // Fallback: if no URL provided, fetch from API (slower)
      if (!thumbnailUrl) {
        const fileInfo = await drive.files.get({
          fileId: id,
          fields: "thumbnailLink"
        });
        thumbnailUrl = fileInfo.data.thumbnailLink?.replace(/=s\d+/, "=s600") || null;
      }
      
      if (!thumbnailUrl) {
        return new NextResponse("Thumbnail not available", { status: 404 });
      }
      
      // Fetch thumbnail from Google
      const thumbResponse = await fetch(thumbnailUrl);
      if (!thumbResponse.ok) {
        return new NextResponse("Failed to fetch thumbnail", { status: 502 });
      }
      
      const contentType = thumbResponse.headers.get("content-type") || "image/jpeg";
      headers.set("Content-Type", contentType);
      headers.set("X-Cache", "MISS");
      
      const arrayBuffer = await thumbResponse.arrayBuffer();
      
      // Store in cache (with size limit)
      if (thumbnailCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entries
        const entries = Array.from(thumbnailCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 50; i++) { // Remove oldest 50
          thumbnailCache.delete(entries[i][0]);
        }
      }
      thumbnailCache.set(cacheKey, { data: arrayBuffer, contentType, timestamp: Date.now() });
      
      return new NextResponse(arrayBuffer, { headers });
      
    } else {
      // Stream original file content
      const response = await drive.files.get(
        { fileId: id, alt: "media" },
        { responseType: "stream" }
      );

      // Set content type from Google response
      const contentType = response.headers["content-type"] || "application/octet-stream";
      headers.set("Content-Type", contentType.toString());
      
      // Set content length if available
      const contentLength = response.headers["content-length"];
      if (contentLength) {
        headers.set("Content-Length", contentLength.toString());
      }
      
      // Set filename for "Save As" dialog
      const name = request.nextUrl.searchParams.get("name") || "image.jpg";
      headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(name)}"`);

      // Stream the response
      const stream = iteratorToStream(nodeStreamToIterator(response.data as Readable));

      return new NextResponse(stream, { headers });
    }

  } catch (error: any) {
    console.error("Error serving Drive image:", error?.message || error);
    
    // Return specific error for debugging
    if (error?.code === 404) {
      return new NextResponse("File not found", { status: 404 });
    }
    
    return new NextResponse("Error serving image", { status: 500 });
  }
}
