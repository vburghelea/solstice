CREATE TYPE "public"."game_participant_role" AS ENUM('player', 'invited', 'applicant');--> statement-breakpoint
CREATE TYPE "public"."game_participant_status" AS ENUM('approved', 'rejected', 'pending');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'canceled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."game_visibility" AS ENUM('public', 'protected', 'private');--> statement-breakpoint
CREATE TABLE "game_participants" (
	"id" uuid PRIMARY KEY,
	"game_id" uuid,
	"user_id" text NOT NULL,
	"role" "game_participant_role" DEFAULT 'player' NOT NULL,
	"status" "game_participant_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY,
	"owner_id" text NOT NULL,
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
	"visibility" "game_visibility" DEFAULT 'public' NOT NULL,
	"safety_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_participants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "game_participants" ALTER COLUMN "game_id" TYPE uuid USING game_id::uuid;--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE cascade ON UPDATE no action;