import { NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const FACE_SERVICE_API_KEY = process.env.FACE_SERVICE_API_KEY || "";

/**
 * POST /api/face-index
 * 
 * Triggered by the webhook when a new image is added to Google Drive.
 * Sends the image to Python Face Service for face indexing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drive_image_id, image_name } = body;

    if (!drive_image_id) {
      return NextResponse.json(
        { error: "Missing drive_image_id" },
        { status: 400 }
      );
    }

    // Forward to Python Face Service
    const formData = new FormData();
    formData.append("drive_image_id", drive_image_id);
    formData.append("image_name", image_name || "unknown.jpg");

    const response = await fetch(
      `${FACE_SERVICE_URL}/api/index-image`,
      {
        method: "POST",
        headers: {
          "X-API-Key": FACE_SERVICE_API_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Face index error:", response.status, errorText);
      return NextResponse.json(
        { error: "Face indexing failed", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Face index proxy error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
