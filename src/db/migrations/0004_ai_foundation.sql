CREATE TYPE "public"."ai_prompt_version_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_operation" AS ENUM('text', 'structured', 'embedding');--> statement-breakpoint
CREATE TABLE "ai_prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"audiences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "ai_prompt_version_status" DEFAULT 'draft' NOT NULL,
	"system_prompt" text,
	"user_prompt" text NOT NULL,
	"model" text NOT NULL,
	"temperature" real,
	"top_p" real,
	"max_tokens" integer,
	"model_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation" "ai_usage_operation" DEFAULT 'text' NOT NULL,
	"status" "ai_usage_status" DEFAULT 'success' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"template_id" uuid,
	"prompt_version_id" uuid,
	"organization_id" uuid,
	"user_id" text,
	"request_id" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"latency_ms" integer,
	"cost_usd_micros" integer,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD CONSTRAINT "ai_prompt_versions_template_id_ai_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ai_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD CONSTRAINT "ai_prompt_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_template_id_ai_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ai_prompt_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_prompt_version_id_ai_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."ai_prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_prompt_templates_key_unique" ON "ai_prompt_templates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "ai_prompt_templates_org_idx" ON "ai_prompt_templates" USING btree ("organization_id","key");--> statement-breakpoint
CREATE INDEX "ai_prompt_templates_updated_idx" ON "ai_prompt_templates" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_prompt_versions_template_version_idx" ON "ai_prompt_versions" USING btree ("template_id","version");--> statement-breakpoint
CREATE INDEX "ai_prompt_versions_template_status_idx" ON "ai_prompt_versions" USING btree ("template_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_prompt_versions_active_unique" ON "ai_prompt_versions" USING btree ("template_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "ai_usage_logs_org_idx" ON "ai_usage_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_user_idx" ON "ai_usage_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_template_idx" ON "ai_usage_logs" USING btree ("template_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_version_idx" ON "ai_usage_logs" USING btree ("prompt_version_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_status_idx" ON "ai_usage_logs" USING btree ("status","created_at");
