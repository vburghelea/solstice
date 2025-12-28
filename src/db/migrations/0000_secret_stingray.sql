CREATE TYPE "public"."data_quality_run_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('tournament', 'league', 'camp', 'clinic', 'social', 'other');--> statement-breakpoint
CREATE TYPE "public"."registration_type" AS ENUM('team', 'individual', 'both');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."form_submission_status" AS ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."import_lane" AS ENUM('interactive', 'batch');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('pending', 'validating', 'validated', 'importing', 'completed', 'failed', 'cancelled', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."import_type" AS ENUM('csv', 'excel');--> statement-breakpoint
CREATE TYPE "public"."organization_invite_link_role" AS ENUM('reporter', 'viewer', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_join_request_role" AS ENUM('reporter', 'viewer', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_join_request_status" AS ENUM('pending', 'approved', 'denied', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delegated_access_scope" AS ENUM('reporting', 'analytics', 'admin');--> statement-breakpoint
CREATE TYPE "public"."organization_member_role" AS ENUM('owner', 'admin', 'reporter', 'viewer', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_member_status" AS ENUM('pending', 'active', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('pending', 'active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('governing_body', 'pso', 'league', 'club', 'affiliate');--> statement-breakpoint
CREATE TYPE "public"."legal_hold_scope" AS ENUM('user', 'organization', 'record');--> statement-breakpoint
CREATE TYPE "public"."policy_type" AS ENUM('privacy_policy', 'terms_of_service', 'data_agreement');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_status" AS ENUM('pending', 'processing', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_type" AS ENUM('access', 'export', 'erasure', 'correction');--> statement-breakpoint
CREATE TYPE "public"."reporting_cycle_status" AS ENUM('upcoming', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."reporting_submission_status" AS ENUM('not_started', 'in_progress', 'submitted', 'under_review', 'changes_requested', 'approved', 'overdue', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."support_request_category" AS ENUM('question', 'issue', 'feature_request', 'feedback');--> statement-breakpoint
CREATE TYPE "public"."support_request_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('captain', 'coach', 'player', 'substitute');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'active', 'inactive', 'removed');--> statement-breakpoint
CREATE TYPE "public"."template_context" AS ENUM('forms', 'imports', 'reporting', 'analytics', 'general');--> statement-breakpoint
CREATE TYPE "public"."tutorial_status" AS ENUM('started', 'completed', 'dismissed');--> statement-breakpoint
CREATE TABLE "audit_log_archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_occurred_at" timestamp with time zone NOT NULL,
	"to_occurred_at" timestamp with time zone NOT NULL,
	"object_key" text NOT NULL,
	"bucket" text NOT NULL,
	"row_count" integer NOT NULL,
	"storage_class" text DEFAULT 'DEEP_ARCHIVE' NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"actor_org_id" uuid,
	"actor_ip" "inet",
	"actor_user_agent" text,
	"action" text NOT NULL,
	"action_category" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_org_id" uuid,
	"changes" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" text NOT NULL,
	"prev_hash" text,
	"entry_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"last_activity_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"profile_complete" boolean NOT NULL,
	"date_of_birth" timestamp,
	"emergency_contact" text,
	"gender" text,
	"pronouns" text,
	"phone" text,
	"privacy_settings" text,
	"profile_version" integer NOT NULL,
	"profile_updated_at" timestamp,
	"mfa_required" boolean NOT NULL,
	"mfa_enrolled_at" timestamp,
	"two_factor_enabled" boolean NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "data_catalog_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_updated_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_quality_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "data_quality_run_status" DEFAULT 'success' NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"visibility" varchar(50) DEFAULT 'all' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_payment_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"square_checkout_id" varchar(255) NOT NULL,
	"square_payment_link_url" varchar(2048) NOT NULL,
	"square_order_id" varchar(255),
	"square_payment_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'CAD' NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_id" text,
	"user_id" text NOT NULL,
	"registration_type" "registration_type" NOT NULL,
	"division" varchar(100),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"payment_method" varchar(50) DEFAULT 'square' NOT NULL,
	"amount_due_cents" integer DEFAULT 0 NOT NULL,
	"amount_paid_cents" integer,
	"payment_completed_at" timestamp,
	"payment_metadata" jsonb,
	"roster" jsonb,
	"notes" text,
	"internal_notes" text,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"type" "event_type" DEFAULT 'tournament' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"venue_name" varchar(255),
	"venue_address" text,
	"city" varchar(100),
	"province" varchar(50),
	"postal_code" varchar(10),
	"location_notes" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"registration_opens_at" timestamp,
	"registration_closes_at" timestamp,
	"registration_type" "registration_type" DEFAULT 'team' NOT NULL,
	"max_teams" integer,
	"max_participants" integer,
	"min_players_per_team" integer DEFAULT 7,
	"max_players_per_team" integer DEFAULT 21,
	"team_registration_fee" integer DEFAULT 0,
	"individual_registration_fee" integer DEFAULT 0,
	"early_bird_discount" integer DEFAULT 0,
	"early_bird_deadline" timestamp,
	"organizer_id" text NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"rules" jsonb,
	"schedule" jsonb,
	"divisions" jsonb,
	"amenities" jsonb,
	"requirements" jsonb,
	"logo_url" text,
	"banner_url" text,
	"metadata" jsonb,
	"allow_etransfer" boolean DEFAULT false NOT NULL,
	"etransfer_instructions" text,
	"etransfer_recipient" varchar(255),
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "form_submission_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"payload_snapshot" jsonb NOT NULL,
	"changed_by" text,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"form_version_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"import_job_id" uuid,
	"submitter_id" text,
	"status" "form_submission_status" DEFAULT 'draft' NOT NULL,
	"payload" jsonb NOT NULL,
	"completeness_score" integer,
	"missing_fields" jsonb DEFAULT '[]'::jsonb,
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"submitted_at" timestamp with time zone,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" text NOT NULL,
	"storage_key" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_job_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"field_key" text,
	"error_type" text NOT NULL,
	"error_message" text NOT NULL,
	"raw_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" "import_type" NOT NULL,
	"lane" "import_lane" NOT NULL,
	"source_file_key" text NOT NULL,
	"source_file_hash" text NOT NULL,
	"source_row_count" integer,
	"target_form_id" uuid,
	"mapping_template_id" uuid,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"progress_checkpoint" integer DEFAULT 0,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_report_key" text,
	"error_summary" jsonb DEFAULT '{}'::jsonb,
	"can_rollback" boolean DEFAULT true NOT NULL,
	"rollback_before" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_mapping_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"target_form_id" uuid,
	"mappings" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_payment_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"membership_type_id" varchar(255) NOT NULL,
	"square_checkout_id" varchar(255) NOT NULL,
	"square_payment_link_url" varchar(2048) NOT NULL,
	"square_order_id" varchar(255),
	"square_payment_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'CAD' NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_types" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"price_cents" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"membership_type_id" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"payment_provider" varchar(100),
	"payment_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_email_deliveries" (
	"notification_id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"channel_email" boolean DEFAULT true NOT NULL,
	"channel_in_app" boolean DEFAULT true NOT NULL,
	"email_frequency" text DEFAULT 'immediate' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"body_template" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" text NOT NULL,
	"user_id" text,
	"organization_id" uuid,
	"role_filter" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invite_link_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invite_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"token" text NOT NULL,
	"role" "organization_invite_link_role" DEFAULT 'member' NOT NULL,
	"auto_approve" boolean DEFAULT false NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" text
);
--> statement-breakpoint
CREATE TABLE "organization_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "organization_join_request_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"requested_role" "organization_join_request_role" DEFAULT 'member' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delegated_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delegate_user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"scope" "delegated_access_scope" NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "organization_member_role" NOT NULL,
	"status" "organization_member_status" DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp with time zone,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "organization_type" NOT NULL,
	"parent_org_id" uuid,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"is_discoverable" boolean DEFAULT false NOT NULL,
	"join_requests_enabled" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "legal_hold_scope" NOT NULL,
	"scope_id" text NOT NULL,
	"data_type" text,
	"reason" text NOT NULL,
	"applied_by" text,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_by" text,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "policy_type" NOT NULL,
	"version" text NOT NULL,
	"content_url" text,
	"content_hash" text NOT NULL,
	"effective_date" date NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "privacy_request_type" NOT NULL,
	"status" "privacy_request_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_by" text,
	"processed_at" timestamp with time zone,
	"result_url" text,
	"result_expires_at" timestamp with time zone,
	"result_notes" text,
	"rejection_reason" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_type" text NOT NULL,
	"retention_days" integer NOT NULL,
	"archive_after_days" integer,
	"purge_after_days" integer,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_policy_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"policy_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "reporting_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "reporting_cycle_status" DEFAULT 'upcoming' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_submission_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporting_submission_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"notes" text,
	"form_submission_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"form_submission_id" uuid,
	"status" "reporting_submission_status" DEFAULT 'not_started' NOT NULL,
	"submitted_at" timestamp with time zone,
	"submitted_by" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"organization_id" uuid,
	"organization_type" text,
	"title" text NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"reminder_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid,
	"report_id" uuid,
	"export_type" text NOT NULL,
	"data_source" text NOT NULL,
	"filters_used" jsonb NOT NULL,
	"row_count" integer NOT NULL,
	"file_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"data_source" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort" jsonb DEFAULT '{}'::jsonb,
	"owner_id" text NOT NULL,
	"shared_with" jsonb DEFAULT '[]'::jsonb,
	"is_org_wide" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"team_id" text,
	"event_id" text,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "account_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unlock_at" timestamp with time zone,
	"unlocked_by" text,
	"unlocked_at" timestamp with time zone,
	"unlock_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"ip_address" "inet" NOT NULL,
	"user_agent" text,
	"geo_country" text,
	"geo_region" text,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"risk_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"category" "support_request_category" DEFAULT 'question' NOT NULL,
	"status" "support_request_status" DEFAULT 'open' NOT NULL,
	"response_message" text,
	"responded_by" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_member_role" DEFAULT 'player' NOT NULL,
	"status" "team_member_status" DEFAULT 'pending' NOT NULL,
	"jersey_number" varchar(3),
	"position" varchar(50),
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"invited_by" text,
	"notes" text,
	"invited_at" timestamp with time zone,
	"last_invitation_reminder_at" timestamp with time zone,
	"invitation_reminder_count" integer DEFAULT 0 NOT NULL,
	"requested_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"city" varchar(255),
	"province" varchar(2),
	"logo_url" text,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"founded_year" varchar(4),
	"website" text,
	"social_links" text,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"context" "template_context" DEFAULT 'general' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tutorial_id" text NOT NULL,
	"status" "tutorial_status" DEFAULT 'started' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_org_id_organizations_id_fk" FOREIGN KEY ("actor_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_org_id_organizations_id_fk" FOREIGN KEY ("target_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_catalog_entries" ADD CONSTRAINT "data_catalog_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_catalog_entries" ADD CONSTRAINT "data_catalog_entries_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_sessions" ADD CONSTRAINT "event_payment_sessions_registration_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_sessions" ADD CONSTRAINT "event_payment_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_sessions" ADD CONSTRAINT "event_payment_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_versions" ADD CONSTRAINT "form_submission_versions_submission_id_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_versions" ADD CONSTRAINT "form_submission_versions_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_submitter_id_user_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job_errors" ADD CONSTRAINT "import_job_errors_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_target_form_id_forms_id_fk" FOREIGN KEY ("target_form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mapping_templates" ADD CONSTRAINT "import_mapping_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mapping_templates" ADD CONSTRAINT "import_mapping_templates_target_form_id_forms_id_fk" FOREIGN KEY ("target_form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mapping_templates" ADD CONSTRAINT "import_mapping_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payment_sessions" ADD CONSTRAINT "membership_payment_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payment_sessions" ADD CONSTRAINT "membership_payment_sessions_type_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_type_id_membership_types_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_email_deliveries" ADD CONSTRAINT "notification_email_deliveries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_template_fk" FOREIGN KEY ("template_key") REFERENCES "public"."notification_templates"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_link_uses" ADD CONSTRAINT "organization_invite_link_uses_link_fk" FOREIGN KEY ("link_id") REFERENCES "public"."organization_invite_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_link_uses" ADD CONSTRAINT "organization_invite_link_uses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD CONSTRAINT "organization_join_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD CONSTRAINT "organization_join_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD CONSTRAINT "organization_join_requests_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_delegate_user_id_user_id_fk" FOREIGN KEY ("delegate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_access" ADD CONSTRAINT "delegated_access_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_fk" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_applied_by_user_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_released_by_user_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_policy_id_policy_documents_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_cycles" ADD CONSTRAINT "reporting_cycles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submission_history" ADD CONSTRAINT "reporting_submission_history_reporting_submission_fk" FOREIGN KEY ("reporting_submission_id") REFERENCES "public"."reporting_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submission_history" ADD CONSTRAINT "reporting_submission_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submission_history" ADD CONSTRAINT "reporting_submission_history_form_submission_version_fk" FOREIGN KEY ("form_submission_version_id") REFERENCES "public"."form_submission_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submissions" ADD CONSTRAINT "reporting_submissions_task_id_reporting_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."reporting_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submissions" ADD CONSTRAINT "reporting_submissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submissions" ADD CONSTRAINT "reporting_submissions_form_submission_id_form_submissions_id_fk" FOREIGN KEY ("form_submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submissions" ADD CONSTRAINT "reporting_submissions_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_submissions" ADD CONSTRAINT "reporting_submissions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_tasks" ADD CONSTRAINT "reporting_tasks_cycle_id_reporting_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."reporting_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_tasks" ADD CONSTRAINT "reporting_tasks_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_tasks" ADD CONSTRAINT "reporting_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_report_id_saved_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."saved_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_locks" ADD CONSTRAINT "account_locks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_locks" ADD CONSTRAINT "account_locks_unlocked_by_user_id_fk" FOREIGN KEY ("unlocked_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_responded_by_user_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_completions" ADD CONSTRAINT "tutorial_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_archives_range_idx" ON "audit_log_archives" USING btree ("from_occurred_at","to_occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action_category","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_org_idx" ON "audit_logs" USING btree ("target_org_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_request_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "data_catalog_source_unique" ON "data_catalog_entries" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "data_catalog_org_idx" ON "data_catalog_entries" USING btree ("organization_id","source_type");--> statement-breakpoint
CREATE INDEX "data_catalog_title_idx" ON "data_catalog_entries" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "event_payment_sessions_checkout_idx" ON "event_payment_sessions" USING btree ("square_checkout_id");--> statement-breakpoint
CREATE INDEX "event_payment_sessions_payment_idx" ON "event_payment_sessions" USING btree ("square_payment_id");--> statement-breakpoint
CREATE INDEX "event_payment_sessions_registration_idx" ON "event_payment_sessions" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "event_payment_sessions_event_idx" ON "event_payment_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_payment_sessions_user_idx" ON "event_payment_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_submission_versions_unique" ON "form_submission_versions" USING btree ("submission_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "form_versions_unique" ON "form_versions" USING btree ("form_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "forms_org_slug_unique" ON "forms" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "membership_payment_sessions_user_idx" ON "membership_payment_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_payment_sessions_checkout_idx" ON "membership_payment_sessions" USING btree ("square_checkout_id");--> statement-breakpoint
CREATE INDEX "membership_payment_sessions_order_idx" ON "membership_payment_sessions" USING btree ("square_order_id");--> statement-breakpoint
CREATE INDEX "membership_payment_sessions_payment_idx" ON "membership_payment_sessions" USING btree ("square_payment_id");--> statement-breakpoint
CREATE INDEX "membership_payment_sessions_type_idx" ON "membership_payment_sessions" USING btree ("membership_type_id");--> statement-breakpoint
CREATE INDEX "membership_types_status_idx" ON "membership_types" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memberships_end_date_idx" ON "memberships" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "memberships_payment_id_idx" ON "memberships" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_payment_provider_id_unique" ON "memberships" USING btree ("payment_provider","payment_id") WHERE "memberships"."payment_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notification_email_deliveries_user_idx" ON "notification_email_deliveries" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_unique" ON "notification_preferences" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_idx" ON "notifications" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "scheduled_notifications_pending_idx" ON "scheduled_notifications" USING btree ("scheduled_for") WHERE "scheduled_notifications"."sent_at" IS NULL AND "scheduled_notifications"."failed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invite_link_uses_unique" ON "organization_invite_link_uses" USING btree ("link_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_invite_link_uses_link_idx" ON "organization_invite_link_uses" USING btree ("link_id","used_at");--> statement-breakpoint
CREATE INDEX "organization_invite_link_uses_user_idx" ON "organization_invite_link_uses" USING btree ("user_id","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invite_links_token_unique" ON "organization_invite_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_invite_links_token_active_idx" ON "organization_invite_links" USING btree ("token") WHERE "organization_invite_links"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "organization_invite_links_org_active_idx" ON "organization_invite_links" USING btree ("organization_id") WHERE "organization_invite_links"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_join_requests_unique" ON "organization_join_requests" USING btree ("user_id","organization_id","status");--> statement-breakpoint
CREATE INDEX "organization_join_requests_user_idx" ON "organization_join_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "organization_join_requests_org_idx" ON "organization_join_requests" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "delegated_access_user_active_idx" ON "delegated_access" USING btree ("delegate_user_id") WHERE "delegated_access"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "delegated_access_unique_active" ON "delegated_access" USING btree ("delegate_user_id","organization_id","scope") WHERE "delegated_access"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_user_org_unique" ON "organization_members" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_active_idx" ON "organization_members" USING btree ("user_id") WHERE "organization_members"."status" = 'active';--> statement-breakpoint
CREATE INDEX "organization_members_org_active_idx" ON "organization_members" USING btree ("organization_id") WHERE "organization_members"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_parent_idx" ON "organizations" USING btree ("parent_org_id");--> statement-breakpoint
CREATE INDEX "legal_holds_scope_idx" ON "legal_holds" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "legal_holds_data_type_idx" ON "legal_holds" USING btree ("data_type");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_documents_unique" ON "policy_documents" USING btree ("type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "retention_policies_unique" ON "retention_policies" USING btree ("data_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_policy_acceptances_unique" ON "user_policy_acceptances" USING btree ("user_id","policy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reporting_submissions_unique" ON "reporting_submissions" USING btree ("task_id","organization_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_team_id" ON "user_roles" USING btree ("team_id") WHERE "user_roles"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_user_roles_event_id" ON "user_roles" USING btree ("event_id") WHERE "user_roles"."event_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_user_roles_unique" ON "user_roles" USING btree ("user_id","role_id","team_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_user_tags_user_id" ON "user_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_tags_tag_id" ON "user_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_user_tags_expires_at" ON "user_tags" USING btree ("expires_at") WHERE "user_tags"."expires_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_user_tags_unique" ON "user_tags" USING btree ("user_id","tag_id");--> statement-breakpoint
CREATE INDEX "account_locks_active_user_idx" ON "account_locks" USING btree ("user_id") WHERE "account_locks"."unlocked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "security_events_user_created_idx" ON "security_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "security_events_ip_created_idx" ON "security_events" USING btree ("ip_address","created_at");--> statement-breakpoint
CREATE INDEX "support_requests_user_idx" ON "support_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "support_requests_org_idx" ON "support_requests" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "support_requests_status_idx" ON "support_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_team_status_idx" ON "team_members" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "team_members_user_status_idx" ON "team_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_active_user_idx" ON "team_members" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_created_by_idx" ON "teams" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "teams_is_active_idx" ON "teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "templates_context_idx" ON "templates" USING btree ("context","organization_id");--> statement-breakpoint
CREATE INDEX "templates_org_idx" ON "templates" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_completions_unique" ON "tutorial_completions" USING btree ("user_id","tutorial_id");--> statement-breakpoint
CREATE INDEX "tutorial_completions_user_idx" ON "tutorial_completions" USING btree ("user_id","status");
