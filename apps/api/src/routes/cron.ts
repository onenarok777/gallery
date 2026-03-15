import { Hono } from 'hono'

const cronApp = new Hono()

// In the new architecture, the Hono backend receives the cron trigger 
// and forwards the revalidation request to the Next.js frontend cache clearer.
cronApp.get('/refresh-images', async (c) => {
  const authHeader = c.req.header("authorization");
  const secret = c.req.query("secret");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secret !== process.env.CRON_SECRET
  ) {
    return c.text("Unauthorized", 401);
  }

  try {
    
    // 2. Forward revalidation to Next.js Frontend
    // Next.js needs to clear its own Data Cache (fetch cache)
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://web:3000";
    const response = await fetch(`${frontendUrl}/api/cron/refresh-images?secret=${process.env.CRON_SECRET}`);
    
    if (!response.ok) {
        throw new Error("Frontend revalidation failed");
    }
    
    return c.json({ 
      revalidated: true, 
      now: Date.now(),
      message: "Gallery images cache revalidated on both Backend and Frontend" 
    });
  } catch (err) {
    console.error("Cron failed:", err);
    return c.json({ 
      revalidated: false, 
      error: "Failed to revalidate" 
    }, 500);
  }
})

export default cronApp
