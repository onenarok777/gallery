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

app.get('/', async (c) => {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
    return successResponse(c, allEvents);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const event = await db.select().from(events).where(eq(events.id, id));
    if (event.length === 0) {
      return errorResponse(c, 'Event not found', 404);
    }
    return successResponse(c, event[0]);
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

    // 1. Extract Folder ID
    const folderId = extractFolderId(googleFolderLink);
    if (!folderId) {
      return errorResponse(c, 'ลิงก์ Google Folder ไม่ถูกต้อง', 400);
    }

    // 2. Validate Public Access
    try {
      const isPublic = await isFolderPublic(folderId);
      if (!isPublic) {
        return errorResponse(c, 'Google Folder นี้ต้องมีการแชร์แบบสาธารณะ (Anyone with the link can view)', 400);
      }
    } catch (err: any) {
       return errorResponse(c, `ไม่สามารถเข้าถึงโฟลเดอร์ได้: ${err.message}`, 400);
    }
    
    // 3. Generate Snowflake ID
    const id = Snowflake.generate();
    
    const newEvent = await db.insert(events).values({ 
      id,
      title, 
      driveLink: googleFolderLink,
      googleFolderLink: googleFolderLink 
    }).returning();
    
    return successResponse(c, newEvent[0], 201);
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, googleFolderLink } = body;
    
    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    
    if (googleFolderLink) {
        // Validate if updating link
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

        updateData.driveLink = googleFolderLink;
        updateData.googleFolderLink = googleFolderLink;
    }

    const updatedEvent = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
      
    if (updatedEvent.length === 0) {
      return errorResponse(c, 'Event not found', 404);
    }
    return successResponse(c, updatedEvent[0]);
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

export default app;
