import { NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const FACE_SERVICE_API_KEY = process.env.FACE_SERVICE_API_KEY || "";

/**
 * POST /api/face-search
 * 
 * Proxy endpoint: receives an uploaded photo from the frontend,
 * forwards it to the Python Face Service for face search,
 * and returns the results.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const threshold = formData.get("threshold") as string | null;
    const limit = formData.get("limit") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Build query params
    const params = new URLSearchParams();
    if (threshold) params.set("threshold", threshold);
    if (limit) params.set("limit", limit);

    // Forward to Python Face Service
    const forwardFormData = new FormData();
    forwardFormData.append("file", file);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(
      `${FACE_SERVICE_URL}/api/search-face${queryString}`,
      {
        method: "POST",
        headers: {
          "X-API-Key": FACE_SERVICE_API_KEY,
        },
        body: forwardFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: "Face search failed", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.results) {
      result.results = result.results.map((r: any) => ({
        ...r,
        imageSrc: `/api/drive-image/${r.drive_image_id}?name=${encodeURIComponent(r.image_name || "image.jpg")}`,
      }));
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
