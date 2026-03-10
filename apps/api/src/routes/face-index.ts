import { Hono } from 'hono'
import { successResponse, errorResponse } from '../lib/response';

const faceIndexApp = new Hono()

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const FACE_SERVICE_API_KEY = process.env.FACE_SERVICE_API_KEY || "";

faceIndexApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { drive_image_id, image_name } = body;

    if (!drive_image_id) {
      return errorResponse(c, "Missing drive_image_id", 400);
    }

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
      return errorResponse(c, `Face indexing failed: ${errorText}`, response.status);
    }

    const result = await response.json();
    return successResponse(c, result);

  } catch (error: any) {
    return errorResponse(c, "Internal server error", 500);
  }
})

export default faceIndexApp
