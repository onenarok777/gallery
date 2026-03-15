import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");
  const resourceId = request.headers.get("x-goog-resource-id");
  
  console.log("Webhook received:", { channelId, resourceState, resourceId });

  if (!channelId || !channelId.startsWith("gallery-webhook-")) {
    const secret = request.nextUrl.searchParams.get("secret");
    if (REVALIDATE_SECRET && secret === REVALIDATE_SECRET) {
      return await performRevalidation("manual-post");
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid webhook" },
      { status: 401 }
    );
  }

  if (resourceState === "sync") {
    console.log("Webhook sync verified");
    return NextResponse.json({ success: true, message: "Sync acknowledged" });
  }

  if (["add", "remove", "update", "trash", "untrash", "change"].includes(resourceState || "")) {
    console.log(`Drive change detected: ${resourceState}`);
    return await performRevalidation(`webhook-${resourceState}`);
  }

  return NextResponse.json({ success: true, message: "Notification received" });
}

async function performRevalidation(source: string) {
  try {
    // Clear Hono API's image cache (disk + memory)
    try {
      await fetch(`${API_URL}/api/drive-image/clear-cache`, { method: "POST" });
    } catch {
      console.warn("Could not clear API image cache");
    }

    // Revalidate Next.js page cache
    revalidatePath("/", "page");
    
    console.log(`Cache revalidated from: ${source}`);
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared and gallery revalidated",
      source,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Revalidation error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
