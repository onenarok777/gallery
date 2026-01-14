import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDrive } from "@/lib/google-auth";
import { v4 as uuidv4 } from "uuid";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

// Register a webhook to watch the Google Drive folder for changes
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing secret" },
      { status: 401 }
    );
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json(
      { success: false, error: "Missing GOOGLE_DRIVE_FOLDER_ID" },
      { status: 500 }
    );
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { success: false, error: "Missing NEXT_PUBLIC_SITE_URL or VERCEL_URL" },
      { status: 500 }
    );
  }

  try {
    const drive = getAuthenticatedDrive();
    
    // Generate unique channel ID
    const channelId = `gallery-webhook-${uuidv4()}`;
    
    // Webhook expires in 24 hours (max allowed by Google)
    const expiration = Date.now() + 24 * 60 * 60 * 1000;
    
    // Build webhook URL
    const webhookUrl = `${WEBHOOK_URL.startsWith("http") ? WEBHOOK_URL : `https://${WEBHOOK_URL}`}/api/revalidate`;

    // Register the watch channel
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

    return NextResponse.json({
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
    
    // Check for common errors
    if (error?.code === 401) {
      return NextResponse.json(
        { success: false, error: "Authentication failed. Check service account credentials." },
        { status: 401 }
      );
    }
    
    if (error?.code === 403) {
      return NextResponse.json(
        { success: false, error: "Permission denied. Make sure the service account has access to the folder." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Stop watching a channel
export async function DELETE(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const channelId = request.nextUrl.searchParams.get("channelId");
  const resourceId = request.nextUrl.searchParams.get("resourceId");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing secret" },
      { status: 401 }
    );
  }

  if (!channelId || !resourceId) {
    return NextResponse.json(
      { success: false, error: "Missing channelId or resourceId" },
      { status: 400 }
    );
  }

  try {
    const drive = getAuthenticatedDrive();
    
    await drive.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook stopped successfully",
    });

  } catch (error: any) {
    console.error("Failed to stop webhook:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Get instructions
export async function GET(request: NextRequest) {
  const webhookUrl = WEBHOOK_URL 
    ? `${WEBHOOK_URL.startsWith("http") ? WEBHOOK_URL : `https://${WEBHOOK_URL}`}/api/revalidate`
    : "https://your-site.vercel.app/api/revalidate";

  return NextResponse.json({
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
}
