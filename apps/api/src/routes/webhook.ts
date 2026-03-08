import { Hono } from 'hono'
import { getAuthenticatedDrive } from '../lib/google-auth'
import { v4 as uuidv4 } from "uuid";

const webhookApp = new Hono()

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

// Register a webhook to watch the Google Drive folder for changes
webhookApp.post('/register', async (c) => {
  const secret = c.req.query("secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return c.json({ success: false, error: "Invalid or missing secret" }, 401);
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return c.json({ success: false, error: "Missing GOOGLE_DRIVE_FOLDER_ID" }, 500);
  }

  if (!WEBHOOK_URL) {
    return c.json({ success: false, error: "Missing NEXT_PUBLIC_SITE_URL or VERCEL_URL" }, 500);
  }

  try {
    const drive = getAuthenticatedDrive();
    const channelId = `gallery-webhook-${uuidv4()}`;
    // Webhook expires in 24 hours (max allowed by Google)
    const expiration = Date.now() + 24 * 60 * 60 * 1000;
    
    // Webhook URL points to the Next.js frontend (or API proxy if exposed) to clear frontend cache
    const webhookUrl = `${WEBHOOK_URL.startsWith("http") ? WEBHOOK_URL : `https://${WEBHOOK_URL}`}/api/revalidate`;

    const response = await drive.files.watch({
      fileId: folderId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        expiration: expiration.toString(),
      },
    });

    console.log("Webhook registered:", response.data);

    return c.json({
      success: true,
      message: "Webhook registered successfully",
      data: {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: new Date(parseInt(response.data.expiration || "0")).toISOString(),
        webhookUrl,
      },
      note: "Webhook expires in 24 hours. Set up a cron job to renew it daily.",
    });

  } catch (error: any) {
    console.error("Failed to register webhook:", error?.message || error);
    
    if (error?.code === 401) {
      return c.json({ success: false, error: "Authentication failed. Check service account credentials." }, 401);
    }
    
    if (error?.code === 403) {
      return c.json({ success: false, error: "Permission denied. Make sure the service account has access to the folder." }, 403);
    }

    return c.json({ success: false, error: error?.message || "Unknown error" }, 500);
  }
})

// Stop watching a channel
webhookApp.delete('/register', async (c) => {
  const secret = c.req.query("secret");
  const channelId = c.req.query("channelId");
  const resourceId = c.req.query("resourceId");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return c.json({ success: false, error: "Invalid or missing secret" }, 401);
  }

  if (!channelId || !resourceId) {
    return c.json({ success: false, error: "Missing channelId or resourceId" }, 400);
  }

  try {
    const drive = getAuthenticatedDrive();
    await drive.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });

    return c.json({ success: true, message: "Webhook stopped successfully" });

  } catch (error: any) {
    console.error("Failed to stop webhook:", error?.message || error);
    return c.json({ success: false, error: error?.message || "Unknown error" }, 500);
  }
})

// Get instructions
webhookApp.get('/register', (c) => {
  const webhookUrl = WEBHOOK_URL 
    ? `${WEBHOOK_URL.startsWith("http") ? WEBHOOK_URL : `https://${WEBHOOK_URL}`}/api/revalidate`
    : "https://your-site.vercel.app/api/revalidate";

  return c.json({
    instructions: {
      step1: "Add REVALIDATE_SECRET to your .env file",
      step2: "Add NEXT_PUBLIC_SITE_URL to your .env file (e.g., https://your-site.vercel.app)",
      step3: `POST to /api/webhook/register?secret=YOUR_SECRET to register the webhook`,
      step4: "The webhook expires in 24 hours. Set up a cron job to renew it.",
    },
    endpoints: {
      register: "POST /api/webhook/register?secret=xxx",
      stop: "DELETE /api/webhook/register?secret=xxx&channelId=xxx&resourceId=xxx",
      webhook: webhookUrl,
    },
    currentConfig: {
      hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      hasSecret: !!REVALIDATE_SECRET,
      hasSiteUrl: !!WEBHOOK_URL,
    }
  });
})

export default webhookApp
