import { Hono } from 'hono'

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
      return c.json({ error: "No file uploaded" }, 400);
    }

    const params = new URLSearchParams();
    if (typeof threshold === 'string') params.set("threshold", threshold);
    if (typeof limit === 'string') params.set("limit", limit);

    // Filter FormData to exclude non-Blob data if needed, or reconstruct
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
      console.error("Face service error:", response.status, errorText);
      return c.json(
        { error: "Face search failed", details: errorText },
        response.status as any
      );
    }

    const result = await response.json();

    // Enrich results with image URLs for the frontend
    if (result.results) {
      result.results = result.results.map((r: any) => ({
        ...r,
        // Update to use the new Hono API URL internal routing
        imageSrc: `/api/drive-image/${r.drive_image_id}?name=${encodeURIComponent(r.image_name || "image.jpg")}`,
      }));
    }

    return c.json(result);

  } catch (error: any) {
    console.error("Face search proxy error:", error?.message || error);
    return c.json({ error: "Internal server error" }, 500);
  }
})

export default faceSearchApp
