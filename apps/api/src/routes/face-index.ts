import { Hono } from 'hono'

const faceIndexApp = new Hono()

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";
const FACE_SERVICE_API_KEY = process.env.FACE_SERVICE_API_KEY || "";

faceIndexApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { drive_image_id, image_name } = body;

    if (!drive_image_id) {
      return c.json({ error: "Missing drive_image_id" }, 400);
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
      console.error("Face index error:", response.status, errorText);
      return c.json(
        { error: "Face indexing failed", details: errorText },
        response.status as any
      );
    }

    const result = await response.json();
    return c.json(result);

  } catch (error: any) {
    console.error("Face index proxy error:", error?.message || error);
    return c.json({ error: "Internal server error" }, 500);
  }
})

export default faceIndexApp
