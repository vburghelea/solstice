-- Create event-related enums if they are missing and ensure expected values exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'event_status'
  ) THEN
    CREATE TYPE "public"."event_status" AS ENUM (
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  required_values text[] := ARRAY[
    'draft',
    'published',
    'registration_open',
    'registration_closed',
    'in_progress',
    'completed',
    'cancelled'
  ];
  value text;
BEGIN
  FOREACH value IN ARRAY required_values LOOP
    PERFORM 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'event_status'
       AND e.enumlabel = value;
    IF NOT FOUND THEN
      EXECUTE format('ALTER TYPE "public"."event_status" ADD VALUE %L', value);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'event_type'
  ) THEN
    CREATE TYPE "public"."event_type" AS ENUM (
      'tournament',
      'league',
      'camp',
      'clinic',
      'social',
      'other'
    );
  END IF;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  required_values text[] := ARRAY[
    'tournament',
    'league',
    'camp',
    'clinic',
    'social',
    'other'
  ];
  value text;
BEGIN
  FOREACH value IN ARRAY required_values LOOP
    PERFORM 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'event_type'
       AND e.enumlabel = value;
    IF NOT FOUND THEN
      EXECUTE format('ALTER TYPE "public"."event_type" ADD VALUE %L', value);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'registration_type'
  ) THEN
    CREATE TYPE "public"."registration_type" AS ENUM ('team', 'individual', 'both');
  END IF;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  required_values text[] := ARRAY['team', 'individual', 'both'];
  value text;
BEGIN
  FOREACH value IN ARRAY required_values LOOP
    PERFORM 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'registration_type'
       AND e.enumlabel = value;
    IF NOT FOUND THEN
      EXECUTE format('ALTER TYPE "public"."registration_type" ADD VALUE %L', value);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
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
  CONSTRAINT "events_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "events_organizer_id_user_id_fk"
    FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
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
  "cancelled_at" timestamp,
  CONSTRAINT "event_registrations_event_id_events_id_fk"
    FOREIGN KEY ("event_id") REFERENCES "public"."events"("id"),
  CONSTRAINT "event_registrations_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id"),
  CONSTRAINT "event_registrations_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "event_id" uuid NOT NULL,
  "author_id" text NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "visibility" varchar(50) DEFAULT 'all' NOT NULL,
  CONSTRAINT "event_announcements_event_id_events_id_fk"
    FOREIGN KEY ("event_id") REFERENCES "public"."events"("id"),
  CONSTRAINT "event_announcements_author_id_user_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events" USING btree ("start_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_organizer_id_idx" ON "events" USING btree ("organizer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_registrations_event_id_idx" ON "event_registrations" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_registrations_team_id_idx" ON "event_registrations" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_registrations_user_id_idx" ON "event_registrations" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_announcements_event_id_idx" ON "event_announcements" USING btree ("event_id");
