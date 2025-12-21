CREATE TYPE "public"."event_review_status" AS ENUM('pending', 'approved', 'rejected', 'not_required');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "review_status" "event_review_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;