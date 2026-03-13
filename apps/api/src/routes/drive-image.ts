import { Hono } from 'hono'
import { getAuthenticatedDrive } from '../lib/google-auth'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

const driveImageApp = new Hono()

// Ensure cache directory exists at project root for persistence
// In Monorepo, process.cwd() for api is usually apps/api, so we go up two levels for shared cache
const CACHE_DIR = path.join(process.cwd(), "..", "..", ".cache", "images");
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create cache dir:", e);
  }
}

// In-memory cache for images
const imageCache = new Map<string, { data: Uint8Array; contentType: string; timestamp: number; size: number }>();
const MEMORY_CACHE_TTL = 1000 * 60 * 60 * 1; // 1 hour
const MAX_MEMORY_CACHE_SIZE_BYTES = 1024 * 1024 * 256; // 256 MB

let currentMemoryCacheSize = 0;

function addToMemoryCache(key: string, data: Uint8Array, contentType: string) {
  const size = data.byteLength;
  if (size > 1024 * 1024 * 10) return;

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

driveImageApp.get('/folder/:folderId/images', async (c) => {
  try {
    const folderId = c.req.param('folderId')
    const pageToken = c.req.query('pageToken')
    const drive = getAuthenticatedDrive()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`

    const response = await drive.files.list({
      q,
      fields: "nextPageToken, files(id, name, mimeType, imageMediaMetadata, thumbnailLink)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
      pageToken: pageToken || undefined,
    })

    const files = response.data.files
    const nextToken = response.data.nextPageToken

    if (!files) return c.json({ data: { images: [], nextPageToken: undefined }, message: "" })

    const images = files.map((file) => {
      const imageSrc = `${API_URL}/api/drive-image/${file.id}?name=${encodeURIComponent(file.name || "image.jpg")}`

      return {
        id: file.id!,
        name: file.name || "image.jpg",
        src: imageSrc,
        originalSrc: imageSrc,
        mimeType: file.mimeType || "image/jpeg",
        width: file.imageMediaMetadata?.width ?? undefined,
        height: file.imageMediaMetadata?.height ?? undefined,
      }
    })

    return c.json({ data: { images, nextPageToken: nextToken ?? undefined }, message: "" })
  } catch (error: any) {
    console.error("Error fetching images from Drive:", error)
    return c.json({ 
      error: error?.message || "Unknown error",
      message: "Failed to fetch images from Google Drive"
    }, 500)
  }
})

driveImageApp.get('/folder/:folderId/count', async (c) => {
  try {
    const folderId = c.req.param('folderId')
    const drive = getAuthenticatedDrive()
    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`

    let total = 0
    let nextToken: string | undefined

    let listRes = await drive.files.list({
      q,
      fields: "nextPageToken, files(id)",
      pageSize: 1000,
    })

    total += listRes.data.files?.length ?? 0
    nextToken = listRes.data.nextPageToken ?? undefined

    while (nextToken) {
      listRes = await drive.files.list({
        q,
        fields: "nextPageToken, files(id)",
        pageSize: 1000,
        pageToken: nextToken,
      })
      total += listRes.data.files?.length ?? 0
      nextToken = listRes.data.nextPageToken ?? undefined
    }

    return c.json({ data: { count: total }, message: "" })
  } catch (error: any) {
    console.error("Error counting images:", error)
    return c.json({ 
      error: error?.message || "Unknown error",
      message: "Failed to count images"
    }, 500)
  }
})

driveImageApp.get('/:id', async (c) => {
  const id = c.req.param('id')
  const name = c.req.query('name') || "image.jpg"

  if (!id) {
    return c.text("Missing File ID", 400)
  }

  try {
    const cacheKey = `img_${id}`;
    const diskPath = path.join(CACHE_DIR, cacheKey);
    
    c.header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400, max-age=31536000, immutable");
    c.header("Content-Disposition", `inline; filename="${encodeURIComponent(name)}"`);

    // 1. Check Memory Cache
    const memoryCached = imageCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL) {
      c.header("Content-Type", memoryCached.contentType);
      c.header("Content-Length", memoryCached.data.byteLength.toString());
      c.header("X-Cache", "HIT-RAM");
      return c.body(memoryCached.data.buffer.slice(memoryCached.data.byteOffset, memoryCached.data.byteOffset + memoryCached.data.byteLength) as any);
    }

    // 2. Check Disk Cache
    if (fs.existsSync(diskPath)) {
      try {
        const stats = fs.statSync(diskPath);
        if (stats.size > 0) {
          const fileStream = fs.createReadStream(diskPath);
          const ext = name.split('.').pop()?.toLowerCase();
          const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
          
          c.header("Content-Type", mime);
          c.header("Content-Length", stats.size.toString());
          c.header("X-Cache", "HIT-DISK");

          // @ts-ignore Hono supports Node streams with a little cast or standard Web Streams
          const webStream = Readable.toWeb(fileStream);
          return c.body(webStream as any);
        }
      } catch (e) {
        console.error("Disk cache read error:", e);
      }
    }

    // 3. Fetch from Drive
    const drive = getAuthenticatedDrive();
    const response = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "stream" }
    );

    const contentType = (response.headers["content-type"] || "image/jpeg").toString();
    const nodeStream = response.data as unknown as Readable;

    c.header("Content-Type", contentType);
    if (response.headers["content-length"]) {
      c.header("Content-Length", response.headers["content-length"].toString());
    }
    c.header("X-Cache", "MISS");

    const chunks: Uint8Array[] = [];
    const writeStream = fs.createWriteStream(diskPath);
    
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          const uint8Chunk = new Uint8Array(chunk);
          controller.enqueue(uint8Chunk);
          writeStream.write(chunk);
          if (chunks.length * 64 < 1024 * 1024 * 5) { 
             chunks.push(uint8Chunk);
          }
        });

        nodeStream.on("end", () => {
          controller.close();
          writeStream.end();
          const totalBuffered = chunks.reduce((acc, c) => acc + c.length, 0);
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
          if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath); 
        });
      },
      cancel() {
        nodeStream.destroy();
        writeStream.end();
      }
    });

    return c.body(stream as any);

  } catch (error: any) {
    console.error("Error serving Drive image:", error?.message || error);
    if (error?.code === 404) return c.text("File not found", 404);
    return c.text("Error serving image", 500);
  }
})


// Optional: route to clear cache
driveImageApp.post('/clear-cache', (c) => {
  imageCache.clear();
  currentMemoryCacheSize = 0;
  try {
     const files = fs.readdirSync(CACHE_DIR);
     for (const file of files) {
       fs.unlinkSync(path.join(CACHE_DIR, file));
     }
  } catch(e) { console.error("Error clearing disk cache", e); }
  return c.json({ status: "ok", message: "Cache cleared" })
})

export default driveImageApp
