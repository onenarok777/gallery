import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Secret for webhook verification (also used for manual revalidation)
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

// Store for dynamically imported cache clear function
let clearImageCacheFunc: (() => void) | null = null;

async function getClearCacheFunc() {
  if (!clearImageCacheFunc) {
    try {
      const module = await import("@/app/api/drive-image/[id]/route");
      clearImageCacheFunc = module.clearImageCache;
    } catch (e) {
      console.error("Failed to import clearImageCache:", e);
    }
  }
  return clearImageCacheFunc;
}

// Handle GET for manual revalidation with secret
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing secret" },
      { status: 401 }
    );
  }

  return await performRevalidation("manual");
}

// Handle POST for Google Drive webhook notifications
export async function POST(request: NextRequest) {
  // Google Drive sends these headers for webhook verification
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");
  const resourceId = request.headers.get("x-goog-resource-id");
  
  console.log("Webhook received:", { channelId, resourceState, resourceId });

  // Verify this is a legitimate Google Drive notification
  // Check if channel ID matches our expected format
  if (!channelId || !channelId.startsWith("gallery-webhook-")) {
    // Also allow manual POST with secret
    const secret = request.nextUrl.searchParams.get("secret");
    if (REVALIDATE_SECRET && secret === REVALIDATE_SECRET) {
      return await performRevalidation("manual-post");
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid webhook" },
      { status: 401 }
    );
  }

  // Handle sync message (initial verification)
  if (resourceState === "sync") {
    console.log("Webhook sync verified");
    return NextResponse.json({ success: true, message: "Sync acknowledged" });
  }

  // Handle actual changes (add, remove, update, trash, untrash)
  if (["add", "remove", "update", "trash", "untrash", "change"].includes(resourceState || "")) {
    console.log(`Drive change detected: ${resourceState}`);
    return await performRevalidation(`webhook-${resourceState}`);
  }

  return NextResponse.json({ success: true, message: "Notification received" });
}

async function performRevalidation(source: string) {
  try {
    // Clear in-memory image cache
    const clearCache = await getClearCacheFunc();
    if (clearCache) {
      clearCache();
    }
    
    // Revalidate the main gallery page (clears Next.js cache)
    revalidatePath("/", "page");
    
    console.log(`Cache revalidated from: ${source}`);
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared and gallery revalidated",
      source,
      timestamp: new Date().toISOString(),
      note: "In-memory cache cleared. Vercel Edge cache will refresh on next request."
    });
  } catch (error: any) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
