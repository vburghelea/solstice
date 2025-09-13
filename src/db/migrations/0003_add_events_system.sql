-- Create event enums
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'canceled');
CREATE TYPE "public"."event_type" AS ENUM('tournament', 'league', 'camp', 'clinic', 'social', 'other');
CREATE TYPE "public"."registration_type" AS ENUM('team', 'individual', 'both');

-- Create events table
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
	"is_public" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);

-- Create event_registrations table
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
	"roster" jsonb,
	"notes" text,
	"internal_notes" text,
	"confirmed_at" timestamp,
    "canceled_at" timestamp
);

-- Create event_announcements table
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

-- Add foreign key constraints
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for better query performance
CREATE INDEX "events_status_idx" ON "events" ("status");
CREATE INDEX "events_start_date_idx" ON "events" ("start_date");
CREATE INDEX "events_organizer_id_idx" ON "events" ("organizer_id");
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations" ("event_id");
CREATE INDEX "event_registrations_team_id_idx" ON "event_registrations" ("team_id");
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations" ("user_id");
CREATE INDEX "event_announcements_event_id_idx" ON "event_announcements" ("event_id");