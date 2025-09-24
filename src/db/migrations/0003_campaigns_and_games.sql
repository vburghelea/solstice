-- Campaigns and game sessions
CREATE TYPE "public"."campaign_status" AS ENUM (
  'active',
  'canceled',
  'completed'
);

CREATE TYPE "public"."campaign_recurrence" AS ENUM (
  'weekly',
  'bi-weekly',
  'monthly'
);

CREATE TYPE "public"."game_status" AS ENUM (
  'scheduled',
  'canceled',
  'completed'
);

CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" text NOT NULL,
  "game_system_id" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "images" jsonb,
  "recurrence" "public"."campaign_recurrence" NOT NULL,
  "time_of_day" varchar(255) NOT NULL,
  "session_duration" real NOT NULL,
  "price_per_session" real,
  "language" varchar(255) NOT NULL,
  "location" jsonb,
  "status" "public"."campaign_status" NOT NULL DEFAULT 'active',
  "minimum_requirements" jsonb,
  "visibility" "public"."visibility" NOT NULL DEFAULT 'public',
  "safety_rules" jsonb,
  "session_zero_data" jsonb,
  "campaign_expectations" jsonb,
  "table_expectations" jsonb,
  "character_creation_outcome" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "campaigns_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "campaigns_game_system_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE CASCADE
);

CREATE TABLE "campaign_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "role" "public"."participant_role" NOT NULL,
  "status" "public"."participant_status" NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "campaign_participants_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "campaign_participants_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE TABLE "campaign_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "status" "public"."application_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "campaign_applications_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "campaign_applications_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE TABLE "games" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" text NOT NULL,
  "campaign_id" uuid,
  "game_system_id" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "date_time" timestamp NOT NULL,
  "description" text NOT NULL,
  "expected_duration" real NOT NULL,
  "price" real,
  "language" varchar(50) NOT NULL,
  "location" jsonb NOT NULL,
  "status" "public"."game_status" NOT NULL DEFAULT 'scheduled',
  "minimum_requirements" jsonb,
  "visibility" "public"."visibility" NOT NULL DEFAULT 'public',
  "safety_rules" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "games_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "games_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL,
  CONSTRAINT "games_game_system_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE CASCADE
);

CREATE TABLE "game_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "role" "public"."participant_role" NOT NULL DEFAULT 'player',
  "status" "public"."participant_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "game_participants_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE,
  CONSTRAINT "game_participants_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE TABLE "game_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "status" "public"."application_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "game_applications_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE,
  CONSTRAINT "game_applications_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);
