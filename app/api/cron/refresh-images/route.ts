import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Verify secret
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secret !== process.env.CRON_SECRET
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Invalidate the cache for gallery images
    revalidateTag("gallery-images", "default");
    
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      message: "Gallery images cache revalidated" 
    });
  } catch (err) {
    return NextResponse.json({ 
      revalidated: false, 
      error: "Failed to revalidate" 
    }, { status: 500 });
  }
}
