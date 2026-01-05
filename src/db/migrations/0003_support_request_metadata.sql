CREATE TYPE "public"."support_request_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
ALTER TABLE "support_requests" ADD COLUMN "priority" "support_request_priority" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "support_requests" ADD COLUMN "sla_target_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE "support_request_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_request_attachments" ADD CONSTRAINT "support_request_attachments_request_id_support_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."support_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_request_attachments" ADD CONSTRAINT "support_request_attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_request_attachments_request_idx" ON "support_request_attachments" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "support_request_attachments_key_unique" ON "support_request_attachments" USING btree ("storage_key");
