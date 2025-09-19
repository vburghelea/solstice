CREATE TYPE "public"."participant_role" AS ENUM('owner', 'player', 'invited', 'applicant');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('approved', 'rejected', 'pending');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'protected', 'private');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'canceled', 'completed');--> statement-breakpoint

CREATE TABLE "game_applications" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"game_id" uuid,
	"user_id" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_participants" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
	"game_id" uuid,
	"user_id" text NOT NULL,
	"role" "participant_role" DEFAULT 'player' NOT NULL,
	"status" "participant_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
	"owner_id" text NOT NULL,
	"campaign_id" uuid DEFAULT NULL,
	"game_system_id" integer NOT NULL,
	"date_time" timestamp NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"expected_duration" real NOT NULL,
	"price" real,
	"language" varchar(50) NOT NULL,
	"location" jsonb NOT NULL,
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"minimum_requirements" jsonb,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"safety_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_applications" ADD CONSTRAINT "game_applications_games_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_applications" ADD CONSTRAINT "game_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "game_participants" ALTER COLUMN "game_id" TYPE uuid USING game_id::uuid;--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE cascade ON UPDATE no action;