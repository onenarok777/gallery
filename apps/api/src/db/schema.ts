import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  driveLink: text('drive_link').notNull(), // Legacy field
  googleLink: text('google_link'),
  googleFolderLink: text('google_folder_link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
