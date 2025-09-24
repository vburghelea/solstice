-- Events and registrations
CREATE TYPE "public"."event_status" AS ENUM (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'canceled'
);

CREATE TYPE "public"."event_type" AS ENUM (
  'tournament',
  'league',
  'camp',
  'clinic',
  'social',
  'other'
);

CREATE TYPE "public"."registration_type" AS ENUM (
  'team',
  'individual',
  'both'
);

CREATE TABLE "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "short_description" varchar(500),
  "type" "public"."event_type" NOT NULL DEFAULT 'tournament',
  "status" "public"."event_status" NOT NULL DEFAULT 'draft',
  "venue_name" varchar(255),
  "venue_address" text,
  "city" varchar(100),
  "province" varchar(50),
  "country" varchar(50),
  "postal_code" varchar(10),
  "location_notes" text,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "registration_opens_at" timestamp,
  "registration_closes_at" timestamp,
  "registration_type" "public"."registration_type" NOT NULL DEFAULT 'team',
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
  "is_public" boolean NOT NULL DEFAULT false,
  "is_featured" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "allow_etransfer" boolean NOT NULL DEFAULT false,
  "etransfer_instructions" text,
  "etransfer_recipient" varchar(255),
  CONSTRAINT "events_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "events_organizer_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id")
);

CREATE TABLE "event_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "event_id" uuid NOT NULL,
  "team_id" text,
  "user_id" text NOT NULL,
  "registration_type" "public"."registration_type" NOT NULL,
  "division" varchar(100),
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "payment_status" varchar(50) NOT NULL DEFAULT 'pending',
  "payment_id" text,
  "payment_method" varchar(50) NOT NULL DEFAULT 'square',
  "amount_due_cents" integer NOT NULL DEFAULT 0,
  "amount_paid_cents" integer,
  "payment_completed_at" timestamp,
  "payment_metadata" jsonb,
  "roster" jsonb,
  "notes" text,
  "internal_notes" text,
  "confirmed_at" timestamp,
  "canceled_at" timestamp,
  CONSTRAINT "event_registrations_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE,
  CONSTRAINT "event_registrations_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id"),
  CONSTRAINT "event_registrations_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
);

CREATE TABLE "event_payment_sessions" (
  "id" varchar(255) PRIMARY KEY,
  "registration_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "square_checkout_id" varchar(255) NOT NULL,
  "square_payment_link_url" varchar(2048) NOT NULL,
  "square_order_id" varchar(255),
  "square_payment_id" varchar(255),
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "amount_cents" integer NOT NULL,
  "currency" varchar(10) NOT NULL DEFAULT 'CAD',
  "expires_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "event_payment_sessions_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE CASCADE,
  CONSTRAINT "event_payment_sessions_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE,
  CONSTRAINT "event_payment_sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "event_payment_sessions_checkout_idx" ON "public"."event_payment_sessions" ("square_checkout_id");
CREATE INDEX "event_payment_sessions_payment_idx" ON "public"."event_payment_sessions" ("square_payment_id");
CREATE INDEX "event_payment_sessions_registration_idx" ON "public"."event_payment_sessions" ("registration_id");
CREATE INDEX "event_payment_sessions_event_idx" ON "public"."event_payment_sessions" ("event_id");
CREATE INDEX "event_payment_sessions_user_idx" ON "public"."event_payment_sessions" ("user_id");

CREATE TABLE "event_announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "event_id" uuid NOT NULL,
  "author_id" text NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "is_published" boolean NOT NULL DEFAULT true,
  "visibility" varchar(50) NOT NULL DEFAULT 'all',
  CONSTRAINT "event_announcements_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE,
  CONSTRAINT "event_announcements_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id")
);
