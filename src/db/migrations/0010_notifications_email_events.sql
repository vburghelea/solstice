CREATE TABLE "email_events" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"dedupe_key" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"entity_id" text,
	"recipient_email" text NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_dedupe_key_unique" UNIQUE (dedupe_key);--> statement-breakpoint
