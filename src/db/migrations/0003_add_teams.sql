-- Create team member role enum
CREATE TYPE "public"."team_member_role" AS ENUM('captain', 'coach', 'player', 'substitute');

-- Create team member status enum
CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'active', 'inactive', 'removed');

-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"city" varchar(255),
	"country" varchar(2),
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

-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
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
	"notes" text
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "teams_slug_idx" ON "teams" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "teams_created_by_idx" ON "teams" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "teams_is_active_idx" ON "teams" USING btree ("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");
CREATE INDEX IF NOT EXISTS "team_members_team_status_idx" ON "team_members" USING btree ("team_id","status");
CREATE INDEX IF NOT EXISTS "team_members_user_status_idx" ON "team_members" USING btree ("user_id","status");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_active_user_idx" ON "team_members" USING btree ("user_id") WHERE status = 'active';

-- Add foreign keys
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;

