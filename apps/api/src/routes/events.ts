import { Hono } from 'hono';
import { db } from '../db';
import { events } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Snowflake } from '../lib/snowflake';
import { extractFolderId, isFolderPublic } from '../lib/drive-validator';
import { successResponse, errorResponse } from '../lib/response';

const app = new Hono();

// Init Snowflake once (Node ID 1 for now)
Snowflake.init(1);

import { qrSettings } from '../db/schema';

app.get('/', async (c) => {
  try {
    const allEvents = await db
      .select()
      .from(events)
      .leftJoin(qrSettings, eq(events.id, qrSettings.eventId))
      .orderBy(desc(events.createdAt));
    
    // Flatten the result to match the expected format if needed, 
    // or keep it nested. Let's flatten for compatibility but 
    // include settings as a sub-object if possible.
    // For simplicity, let's map it:
    const formatted = allEvents.map(({ events, qr_settings }) => ({
      ...events,
      qrSettings: qr_settings
    }));

    return successResponse(c, formatted);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await db
      .select()
      .from(events)
      .leftJoin(qrSettings, eq(events.id, qrSettings.eventId))
      .where(eq(events.id, id));

    if (result.length === 0) {
      return errorResponse(c, 'Event not found', 404);
    }

    const eventData = {
      ...result[0].events,
      qrSettings: result[0].qr_settings
    };

    return successResponse(c, eventData);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, googleFolderLink } = body;
    
    if (!title) {
      return errorResponse(c, 'ชื่องานเป็นสิ่งจำเป็น', 400);
    }
    
    if (!googleFolderLink) {
      return errorResponse(c, 'Google Folder Link เป็นสิ่งจำเป็น', 400);
    }

    const folderId = extractFolderId(googleFolderLink);
    if (!folderId) {
      return errorResponse(c, 'ลิงก์ Google Folder ไม่ถูกต้อง', 400);
    }

    try {
      const isPublic = await isFolderPublic(folderId);
      if (!isPublic) {
        return errorResponse(c, 'Google Folder นี้ต้องมีการแชร์แบบสาธารณะ (Anyone with the link can view)', 400);
      }
    } catch (err: any) {
       return errorResponse(c, `ไม่สามารถเข้าถึงโฟลเดอร์ได้: ${err.message}`, 400);
    }
    
    const id = Snowflake.generate();
    
    const [newEvent] = await db.insert(events).values({ 
      id,
      title, 
      driveLink: googleFolderLink
    }).returning();

    // Initialize QR settings
    await db.insert(qrSettings).values({
      eventId: id,
    });
    
    return successResponse(c, newEvent, 201);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, googleFolderLink, qrLogoUrl, qrFgColor, qrBgColor } = body;
    
    // Update Event Table
    const eventUpdate: any = { updatedAt: new Date() };
    if (title) eventUpdate.title = title;
    if (googleFolderLink) {
      const folderId = extractFolderId(googleFolderLink);
      if (folderId) {
        eventUpdate.driveLink = googleFolderLink;
      }
    }

    if (Object.keys(eventUpdate).length > 1) {
      await db.update(events).set(eventUpdate).where(eq(events.id, id));
    }

    // Update QR Settings Table
    const qrUpdate: any = { updatedAt: new Date() };
    if (qrLogoUrl !== undefined) qrUpdate.logoUrl = qrLogoUrl;
    if (qrFgColor !== undefined) qrUpdate.fgColor = qrFgColor;
    if (qrBgColor !== undefined) qrUpdate.bgColor = qrBgColor;

    if (Object.keys(qrUpdate).length > 1) {
      // Upsert logic for QR settings
      const existing = await db.select().from(qrSettings).where(eq(qrSettings.eventId, id));
      if (existing.length > 0) {
        await db.update(qrSettings).set(qrUpdate).where(eq(qrSettings.eventId, id));
      } else {
        await db.insert(qrSettings).values({ ...qrUpdate, eventId: id });
      }
    }

    const updated = await db
      .select()
      .from(events)
      .leftJoin(qrSettings, eq(events.id, qrSettings.eventId))
      .where(eq(events.id, id));

    return successResponse(c, {
      ...updated[0].events,
      qrSettings: updated[0].qr_settings
    });
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedEvent = await db.delete(events).where(eq(events.id, id)).returning();
    
    if (deletedEvent.length === 0) {
      return errorResponse(c, 'Event not found', 404);
    }
    return successResponse(c, deletedEvent[0]);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

export default app;
