-- Publishers table
CREATE TABLE IF NOT EXISTS "publishers" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "website_url" varchar(255),
  "wikipedia_url" varchar(255),
  "bgg_publisher_id" integer,
  "verified" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Media assets table
CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL REFERENCES "game_systems"("id"),
  "public_id" varchar(255) NOT NULL,
  "secure_url" text NOT NULL,
  "width" integer,
  "height" integer,
  "format" varchar(50),
  "license" varchar(255),
  "license_url" varchar(255),
  "kind" varchar(50),
  "order_index" integer DEFAULT 0,
  "moderated" boolean DEFAULT false NOT NULL,
  "checksum" varchar(64),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- FAQs table
CREATE TABLE IF NOT EXISTS "faqs" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL REFERENCES "game_systems"("id"),
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "source" text,
  "is_cms_override" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- External category map
CREATE TABLE IF NOT EXISTS "external_category_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "category_id" integer NOT NULL REFERENCES "game_system_categories"("id"),
  "confidence" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "external_category_map_source_tag_unique" UNIQUE ("source", "external_tag")
);

-- External mechanic map
CREATE TABLE IF NOT EXISTS "external_mechanic_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "mechanic_id" integer NOT NULL REFERENCES "game_system_mechanics"("id"),
  "confidence" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "external_mechanic_map_source_tag_unique" UNIQUE ("source", "external_tag")
);

-- System crawl events
CREATE TABLE IF NOT EXISTS "system_crawl_events" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL REFERENCES "game_systems"("id"),
  "source" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL,
  "started_at" timestamp NOT NULL,
  "finished_at" timestamp NOT NULL,
  "http_status" integer,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Alter game_systems
ALTER TABLE "game_systems" RENAME COLUMN "description" TO "description_scraped";
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "description_cms" text;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "release_date" date;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "publisher_id" integer REFERENCES "publishers"("id");
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "publisher_url" varchar(255);
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "hero_image_id" integer REFERENCES "media_assets"("id");
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "source_of_truth" text;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "external_refs" jsonb;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "crawl_status" varchar(50);
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "last_crawled_at" timestamp;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "last_success_at" timestamp;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "error_message" text;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false NOT NULL;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "cms_version" integer DEFAULT 1;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "cms_approved" boolean DEFAULT false NOT NULL;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "last_approved_at" timestamp;
ALTER TABLE "game_systems" ADD COLUMN IF NOT EXISTS "last_approved_by" text REFERENCES "user"("id");
ALTER TABLE "game_systems" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "game_systems_slug_unique" ON "game_systems" ("slug");
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "images";
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "optimal_players";
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "average_play_time";
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "age_rating";
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "complexity_rating";
ALTER TABLE "game_systems" DROP COLUMN IF EXISTS "year_released";
