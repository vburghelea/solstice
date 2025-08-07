CREATE TYPE "public"."campaign_recurrence" AS ENUM('weekly', 'bi-weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'canceled', 'completed');--> statement-breakpoint

CREATE TABLE "campaign_applications" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_participants" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "participant_role" DEFAULT 'player' NOT NULL,
	"status" "participant_status"  DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"game_system_id" integer NOT NULL,
	"images" jsonb,
	"recurrence" "campaign_recurrence" NOT NULL,
	"time_of_day" varchar(255) NOT NULL,
	"session_duration" real NOT NULL,
	"price_per_session" real,
	"language" varchar(255) NOT NULL,
	"location" jsonb,
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"minimum_requirements" jsonb,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"safety_rules" jsonb,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
