CREATE TABLE "c15t"."audit_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"entity_type" varchar(255) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"action_type" varchar(255) NOT NULL,
	"subject_id" varchar(255),
	"ip_address" varchar(255),
	"user_agent" text,
	"changes" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_timezone" varchar(255) DEFAULT 'UTC' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."consent" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subject_id" varchar(255) NOT NULL,
	"domain_id" varchar(255) NOT NULL,
	"policy_id" varchar(255),
	"purpose_ids" jsonb NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(255),
	"user_agent" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"withdrawal_reason" text,
	"given_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."consent_policy" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"version" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"expiration_date" timestamp with time zone,
	"content" text NOT NULL,
	"content_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."consent_purpose" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"is_essential" boolean NOT NULL,
	"data_category" varchar(255),
	"legal_basis" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."consent_record" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subject_id" varchar(255) NOT NULL,
	"consent_id" varchar(255),
	"action_type" varchar(255) NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."domain" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"allowed_origins" jsonb,
	"is_verified" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c15t"."subject" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"is_identified" boolean DEFAULT false NOT NULL,
	"external_id" varchar(255),
	"identity_provider" varchar(255),
	"last_ip_address" varchar(255),
	"subject_timezone" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
