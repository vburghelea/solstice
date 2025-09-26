-- Team management
CREATE TYPE "public"."team_member_role" AS ENUM (
  'captain',
  'coach',
  'player',
  'substitute'
);

CREATE TYPE "public"."team_member_status" AS ENUM (
  'pending',
  'active',
  'inactive',
  'removed',
  'declined'
);

CREATE TABLE "teams" (
  "id" text PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "city" varchar(255),
  "country" varchar(3),
  "logo_url" text,
  "primary_color" varchar(7),
  "secondary_color" varchar(7),
  "founded_year" varchar(4),
  "website" text,
  "social_links" text,
  "is_active" text NOT NULL DEFAULT 'true',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" text NOT NULL,
  CONSTRAINT "teams_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "teams_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
);

CREATE TABLE "team_members" (
  "id" text PRIMARY KEY,
  "team_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" "public"."team_member_role" NOT NULL DEFAULT 'player',
  "status" "public"."team_member_status" NOT NULL DEFAULT 'pending',
  "jersey_number" varchar(3),
  "position" varchar(50),
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  "left_at" timestamp with time zone,
  "invited_by" text,
  "notes" text,
  "invited_at" timestamp with time zone,
  "last_invitation_reminder_at" timestamp with time zone,
  "invitation_reminder_count" integer NOT NULL DEFAULT 0,
  "requested_at" timestamp with time zone,
  "approved_by" text REFERENCES "public"."user"("id"),
  "decision_at" timestamp with time zone,
  CONSTRAINT "team_members_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE,
  CONSTRAINT "team_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "team_members_invited_by_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id")
);

CREATE UNIQUE INDEX "teams_slug_idx" ON "public"."teams" ("slug");
CREATE INDEX "teams_created_by_idx" ON "public"."teams" ("created_by");
CREATE INDEX "teams_is_active_idx" ON "public"."teams" ("is_active");

CREATE UNIQUE INDEX "team_members_team_user_idx" ON "public"."team_members" ("team_id", "user_id");
CREATE INDEX "team_members_team_status_idx" ON "public"."team_members" ("team_id", "status");
CREATE INDEX "team_members_user_status_idx" ON "public"."team_members" ("user_id", "status");
CREATE UNIQUE INDEX "team_members_active_user_idx" ON "public"."team_members" ("user_id") WHERE "status" = 'active';
