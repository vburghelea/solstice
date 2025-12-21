ALTER TABLE "events" DROP CONSTRAINT "events_reviewed_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "review_status";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "review_notes";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "reviewed_at";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "reviewed_by";--> statement-breakpoint
DROP TYPE "public"."event_review_status";