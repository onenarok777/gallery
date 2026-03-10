import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  driveLink: text('drive_link').notNull(), // Legacy field
  googleLink: text('google_link'),
  googleFolderLink: text('google_folder_link'),
  // Legacy fields - to be removed after migration
  qrLogoUrl: text('qr_logo_url'),
  qrFgColor: text('qr_fg_color').default('#000000'),
  qrBgColor: text('qr_bg_color').default('#ffffff'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const qrSettings = pgTable('qr_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }).unique(),
  logoUrl: text('logo_url'),
  fgColor: text('fg_color').default('#000000'),
  bgColor: text('bg_color').default('#ffffff'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
