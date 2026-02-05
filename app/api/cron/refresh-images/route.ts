import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
// Import the clear function we exported earlier
import { clearImageCache } from "../../drive-image/[id]/route";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const isFullRefresh = searchParams.get("full") === "true";

  // Verify secret
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secret !== process.env.CRON_SECRET
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let message = "Gallery images list revalidated (Light update)";

    // 1. Clear physical disk/memory cache ONLY if requested (Heavy)
    if (isFullRefresh) {
      console.log("Cron: Clearing physical image cache (Full update)...");
      try {
        clearImageCache();
        message = "Full refresh: Disk cache cleared & List revalidated";
      } catch (e) {
        console.error("Cron: Failed to clear image cache:", e);
      }
    } else {
      console.log("Cron: Light update - Keeping disk cache, updating list only.");
    }

    // 2. Invalidate the metadata cache (Next.js Data Cache)
    // This fetches the new list of files from Drive (fast & cheap)
    console.log("Cron: Revalidating Next.js tags...");
    // @ts-ignore
    revalidateTag("gallery-images", "default");
    // @ts-ignore
    revalidateTag("default", "default"); 
    
    return NextResponse.json({ 
      revalidated: true, 
      mode: isFullRefresh ? "full" : "light",
      now: Date.now(),
      message 
    });
  } catch (err) {
    console.error("Cron Error:", err);
    return NextResponse.json({ 
      revalidated: false, 
      error: "Failed to revalidate" 
    }, { status: 500 });
  }
}
