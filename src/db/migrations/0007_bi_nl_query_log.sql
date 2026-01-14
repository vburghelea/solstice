CREATE TABLE "bi_nl_query_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid,
	"dataset_id" text,
	"question" text,
	"intent" jsonb,
	"confidence" real,
	"approved" boolean DEFAULT false NOT NULL,
	"stage" text NOT NULL,
	"provider" text,
	"model" text,
	"latency_ms" integer,
	"execution_time_ms" integer,
	"rows_returned" integer,
	"query_hash" text NOT NULL,
	"previous_log_id" uuid,
	"checksum" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bi_nl_query_log" ADD CONSTRAINT "bi_nl_query_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bi_nl_query_log" ADD CONSTRAINT "bi_nl_query_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "bi_nl_query_log_org_idx" ON "bi_nl_query_log" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "bi_nl_query_log_user_idx" ON "bi_nl_query_log" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "bi_nl_query_log_stage_idx" ON "bi_nl_query_log" USING btree ("stage","created_at");
