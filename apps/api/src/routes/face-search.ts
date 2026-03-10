import { Hono } from 'hono'
import { successResponse, errorResponse } from '../lib/response';

const faceSearchApp = new Hono()

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const FACE_SERVICE_API_KEY = process.env.FACE_SERVICE_API_KEY || "";

faceSearchApp.post('/', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const threshold = formData.get("threshold");
    const limit = formData.get("limit");

    if (!file) {
      return errorResponse(c, "No file uploaded", 400);
    }

    const params = new URLSearchParams();
    if (typeof threshold === 'string') params.set("threshold", threshold);
    if (typeof limit === 'string') params.set("limit", limit);

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
      return errorResponse(c, `Face search failed: ${errorText}`, response.status);
    }

    const result = await response.json();

    if (result.results) {
      result.results = result.results.map((r: any) => ({
        ...r,
        imageSrc: `/api/drive-image/${r.drive_image_id}?name=${encodeURIComponent(r.image_name || "image.jpg")}`,
      }));
    }

    return successResponse(c, result);

  } catch (error: any) {
    return errorResponse(c, "Internal server error", 500);
  }
})

export default faceSearchApp
