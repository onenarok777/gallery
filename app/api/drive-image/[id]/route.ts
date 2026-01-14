import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDrive } from "@/lib/google-auth";
import { Readable } from "stream";

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
      // Get file metadata with thumbnailLink
      const fileInfo = await drive.files.get({
        fileId: id,
        fields: "thumbnailLink"
      });
      
      const thumbnailUrl = fileInfo.data.thumbnailLink;
      if (!thumbnailUrl) {
        return new NextResponse("Thumbnail not available", { status: 404 });
      }
      
      // Replace thumbnail size for larger preview (600px)
      const largerThumbUrl = thumbnailUrl.replace(/=s\d+/, "=s600");
      
      // Fetch thumbnail from Google
      const thumbResponse = await fetch(largerThumbUrl);
      if (!thumbResponse.ok) {
        return new NextResponse("Failed to fetch thumbnail", { status: 502 });
      }
      
      const contentType = thumbResponse.headers.get("content-type") || "image/jpeg";
      headers.set("Content-Type", contentType);
      
      const arrayBuffer = await thumbResponse.arrayBuffer();
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
