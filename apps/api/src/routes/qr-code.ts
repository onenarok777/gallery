import { Hono } from 'hono';
import { db } from '../db';
import { qrSettings } from '../db/schema';
import { S3Service } from '../lib/s3';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../lib/response';

const app = new Hono();

/**
 * PUT /api/qr-code/:eventId
 * Handles multipart/form-data with optional logo file
 */
app.put('/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const formData = await c.req.formData();
    
    const fgColor = formData.get('fgColor') as string | null;
    const bgColor = formData.get('bgColor') as string | null;
    const includeLogo = formData.get('includeLogo') === 'true';
    const logoFile = formData.get('logoFile') as File | null;

    let logoUrl: string | undefined | null = undefined;

    // Handle file upload if provided
    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const uploadResult = await S3Service.uploadFile(
        buffer,
        logoFile.name,
        logoFile.type
      );
      logoUrl = uploadResult.publicUrl;
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    if (fgColor) updateData.fgColor = fgColor;
    if (bgColor) updateData.bgColor = bgColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    
    // If includeLogo is false, we might want to keep the URL but just hide it
    // but usually user might want to null it if they really want to remove it.
    // In this UI context, if logoUrl is updated, it updates properly.
    // If includeLogo is false, the frontend handles visibility.

    // Check if settings exists
    const existing = await db.select().from(qrSettings).where(eq(qrSettings.eventId, eventId));
    
    if (existing.length > 0) {
      await db.update(qrSettings).set(updateData).where(eq(qrSettings.eventId, eventId));
    } else {
      await db.insert(qrSettings).values({
        ...updateData,
        eventId,
      });
    }

    const updated = await db.select().from(qrSettings).where(eq(qrSettings.eventId, eventId));
    
    return successResponse(c, updated[0]);
  } catch (error: any) {
    console.error('[qr-code route error]', error);
    return errorResponse(c, error.message, 500);
  }
});

export default app;
