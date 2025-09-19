DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'team_member_role'
  ) THEN
    CREATE TYPE "public"."team_member_role" AS ENUM ('captain', 'coach', 'player', 'substitute');
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_role'
     AND e.enumlabel = 'captain';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_role" ADD VALUE 'captain';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_role'
     AND e.enumlabel = 'coach';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_role" ADD VALUE 'coach';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_role'
     AND e.enumlabel = 'player';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_role" ADD VALUE 'player';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_role'
     AND e.enumlabel = 'substitute';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_role" ADD VALUE 'substitute';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'team_member_status'
  ) THEN
    CREATE TYPE "public"."team_member_status" AS ENUM ('pending', 'active', 'inactive', 'removed');
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_status'
     AND e.enumlabel = 'pending';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_status" ADD VALUE 'pending';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_status'
     AND e.enumlabel = 'active';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_status" ADD VALUE 'active';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_status'
     AND e.enumlabel = 'inactive';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_status" ADD VALUE 'inactive';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  PERFORM 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'team_member_status'
     AND e.enumlabel = 'removed';
  IF NOT FOUND THEN
    ALTER TYPE "public"."team_member_status" ADD VALUE 'removed';
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
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
  CONSTRAINT "user_email_unique" UNIQUE ("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
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
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "account_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL,
  CONSTRAINT "session_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "session_token_unique" UNIQUE ("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_types" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" varchar(1000),
  "price_cents" integer NOT NULL,
  "duration_months" integer NOT NULL,
  "status" varchar(50) DEFAULT 'active' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "membership_type_id" varchar(255) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" varchar(50) DEFAULT 'active' NOT NULL,
  "payment_provider" varchar(100),
  "payment_id" varchar(255),
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "memberships_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "memberships_membership_type_id_membership_types_id_fk"
    FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
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
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" text NOT NULL,
  CONSTRAINT "teams_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "teams_created_by_user_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" "team_member_role" DEFAULT 'player' NOT NULL,
  "status" "team_member_status" DEFAULT 'pending' NOT NULL,
  "jersey_number" varchar(3),
  "position" varchar(50),
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  "left_at" timestamp with time zone,
  "invited_by" text,
  "notes" text,
  CONSTRAINT "team_members_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade,
  CONSTRAINT "team_members_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "team_members_invited_by_user_id_fk"
    FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_types_status_idx"
  ON "membership_types" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_user_id_idx"
  ON "memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_status_idx"
  ON "memberships" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_end_date_idx"
  ON "memberships" USING btree ("end_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_payment_id_idx"
  ON "memberships" USING btree ("payment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_slug_idx"
  ON "teams" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_created_by_idx"
  ON "teams" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_is_active_idx"
  ON "teams" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_members_team_status_idx"
  ON "team_members" USING btree ("team_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_members_user_status_idx"
  ON "team_members" USING btree ("user_id", "status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx"
  ON "team_members" USING btree ("team_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_active_user_idx"
  ON "team_members" USING btree ("user_id")
  WHERE "team_members"."status" = 'active'::team_member_status;
