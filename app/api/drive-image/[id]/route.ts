import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDrive } from "@/lib/google-auth";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// Ensure cache directory exists at project root for persistence
const CACHE_DIR = path.join(process.cwd(), ".cache", "images");
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create cache dir:", e);
  }
}

// In-memory cache for images (Small buffer for very hot items)
// Structure: Map<id, { data: Uint8Array, contentType: string, timestamp: number, size: number }>
const imageCache = new Map<string, { data: Uint8Array; contentType: string; timestamp: number; size: number }>();
const MEMORY_CACHE_TTL = 1000 * 60 * 60 * 1; // 1 hour for memory
const MAX_MEMORY_CACHE_SIZE_BYTES = 1024 * 1024 * 256; // 256 MB RAM Limit (reduced to favor Disk)

let currentMemoryCacheSize = 0;

// Helper to manage memory cache size
function addToMemoryCache(key: string, data: Uint8Array, contentType: string) {
  const size = data.byteLength;
  if (size > 1024 * 1024 * 10) return; // Don't put huge files (>10MB) in RAM, let Disk handle them

  while (currentMemoryCacheSize + size > MAX_MEMORY_CACHE_SIZE_BYTES) {
    const firstKey = imageCache.keys().next().value;
    if (!firstKey) break;
    const entry = imageCache.get(firstKey);
    if (entry) {
      currentMemoryCacheSize -= entry.size;
      imageCache.delete(firstKey);
    }
  }

  imageCache.set(key, { data, contentType, timestamp: Date.now(), size });
  currentMemoryCacheSize += size;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new NextResponse("Missing File ID", { status: 400 });
  }

  try {
    const cacheKey = `img_${id}`;
    const diskPath = path.join(CACHE_DIR, cacheKey);
    const headers = new Headers();
    
    // Aggressive Browser Caching
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400, max-age=31536000, immutable");
    const name = request.nextUrl.searchParams.get("name") || "image.jpg";
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(name)}"`);

    // ------------------------------------------------------------------------
    // 1. Check Memory Cache (Fastest - Microseconds)
    // ------------------------------------------------------------------------
    const memoryCached = imageCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL) {
      headers.set("Content-Type", memoryCached.contentType);
      headers.set("Content-Length", memoryCached.data.byteLength.toString());
      headers.set("X-Cache", "HIT-RAM");
      
      return new NextResponse(
        memoryCached.data.buffer.slice(memoryCached.data.byteOffset, memoryCached.data.byteOffset + memoryCached.data.byteLength) as ArrayBuffer, 
        { headers }
      );
    }

    // ------------------------------------------------------------------------
    // 2. Check Disk Cache (Persistent & Large - Milliseconds)
    // ------------------------------------------------------------------------
    if (fs.existsSync(diskPath)) {
      try {
        const stats = fs.statSync(diskPath);
        // Check if file is not empty/corrupt
        if (stats.size > 0) {
          const fileStream = fs.createReadStream(diskPath);
          
          // Try to guess content type. For now, assume jpeg/png based on name or default
          // Since we save raw bytes, we can infer simply.
          const ext = name.split('.').pop()?.toLowerCase();
          const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
          
          headers.set("Content-Type", mime);
          headers.set("Content-Length", stats.size.toString());
          headers.set("X-Cache", "HIT-DISK");

          // @ts-ignore: Next.js supports Node streams in NextResponse
          return new NextResponse(fileStream, { headers });
        }
      } catch (e) {
        // Disk read error, fall through to fetch
        console.error("Disk cache read error:", e);
      }
    }

    // ------------------------------------------------------------------------
    // 3. Fetch from Drive (Stream + Write to Disk)
    // ------------------------------------------------------------------------
    
    const drive = getAuthenticatedDrive();
    const response = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "stream" }
    );

    const contentType = (response.headers["content-type"] || "image/jpeg").toString();
    const nodeStream = response.data as unknown as Readable;

    headers.set("Content-Type", contentType);
    if (response.headers["content-length"]) {
      headers.set("Content-Length", response.headers["content-length"].toString());
    }
    headers.set("X-Cache", "MISS");

    // Create a Web ReadableStream that:
    // 1. Pipes to Response (User)
    // 2. Pipes to Disk (Cache)
    // 3. Pipes to RAM (Optional, for hot access)
    
    const chunks: Uint8Array[] = [];
    const writeStream = fs.createWriteStream(diskPath);
    
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          const uint8Chunk = new Uint8Array(chunk);
          
          // 1. Send to user
          controller.enqueue(uint8Chunk);
          
          // 2. Write to disk
          writeStream.write(chunk); // Async write

          // 3. Buffer for RAM logic (accumulate only for small files)
          // Limit 5MB accumulation to prevent RAM spike on 100 concurrent streams
          if (chunks.length * 64 < 1024 * 1024 * 5) { 
             chunks.push(uint8Chunk);
          }
        });

        nodeStream.on("end", () => {
          controller.close();
          writeStream.end();
          
          // Add to RAM Only if we captured the WHOLE file (didn't skip exceeding accumulation limit)
          // We don't have exact check here easily without keeping total size, 
          // but if we used chunks.push we generally intended to cache it.
          // Let's refine:
          const totalBuffered = chunks.reduce((acc, c) => acc + c.length, 0);
          
          // Heuristic: If buffered size looks like a complete image (e.g. > 2KB) and less than 5MB
          if (totalBuffered > 2048 && totalBuffered < 1024 * 1024 * 5) {
              const fullData = new Uint8Array(totalBuffered);
              let offset = 0;
              for (const chunk of chunks) {
                  fullData.set(chunk, offset);
                  offset += chunk.length;
              }
              addToMemoryCache(cacheKey, fullData, contentType);
          }
        });

        nodeStream.on("error", (err) => {
          console.error("Stream error:", err);
          controller.error(err);
          writeStream.end(); 
          // Delete partial file
          if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath); 
        });
      },
      cancel() {
        nodeStream.destroy();
        writeStream.end();
      }
    });

    return new NextResponse(stream, { headers });

  } catch (error: any) {
    console.error("Error serving Drive image:", error?.message || error);
    if (error?.code === 404) return new NextResponse("File not found", { status: 404 });
    return new NextResponse("Error serving image", { status: 500 });
  }
}

// Export cache for clearing
export function clearImageCache() {
  imageCache.clear();
  currentMemoryCacheSize = 0;
  // Optional: clear disk cache too
  try {
     const files = fs.readdirSync(CACHE_DIR);
     for (const file of files) {
       fs.unlinkSync(path.join(CACHE_DIR, file));
     }
  } catch(e) { console.error("Error clearing disk cache", e); }
  
  console.log("Memory & Disk cache cleared");
}
