CREATE TABLE "qr_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"logo_url" text,
	"fg_color" text DEFAULT '#000000',
	"bg_color" text DEFAULT '#ffffff',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_settings_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "qr_settings" ADD CONSTRAINT "qr_settings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;