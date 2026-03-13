ALTER TABLE "events" ADD COLUMN "is_face_search_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_pagination_enabled" boolean DEFAULT false NOT NULL;