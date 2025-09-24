-- Publishers and game system catalog
CREATE TABLE "publishers" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "website_url" varchar(255),
  "wikipedia_url" varchar(255),
  "bgg_publisher_id" integer,
  "verified" boolean NOT NULL DEFAULT false,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "game_systems" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "slug" varchar(255) UNIQUE,
  "description_cms" text,
  "gallery_images" text[],
  "description_scraped" text,
  "min_players" integer,
  "max_players" integer,
  "optimal_players" integer,
  "average_play_time" integer,
  "age_rating" varchar(50),
  "complexity_rating" varchar(50),
  "year_released" integer,
  "release_date" date,
  "publisher_id" integer,
  "publisher_url" varchar(255),
  "hero_image_id" integer,
  "source_of_truth" text,
  "external_refs" jsonb,
  "crawl_status" varchar(50),
  "last_crawled_at" timestamp,
  "last_success_at" timestamp,
  "error_message" text,
  "is_published" boolean NOT NULL DEFAULT false,
  "cms_version" integer DEFAULT 1,
  "cms_approved" boolean NOT NULL DEFAULT false,
  "last_approved_at" timestamp,
  "last_approved_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "game_systems_publisher_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id"),
  CONSTRAINT "game_systems_last_approved_by_fk" FOREIGN KEY ("last_approved_by") REFERENCES "public"."user"("id")
);

CREATE TABLE "game_system_categories" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "description" text
);

CREATE TABLE "game_system_mechanics" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "description" text
);

CREATE TABLE "game_system_to_category" (
  "game_system_id" integer NOT NULL,
  "category_id" integer NOT NULL,
  PRIMARY KEY ("game_system_id", "category_id"),
  CONSTRAINT "game_system_to_category_system_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id"),
  CONSTRAINT "game_system_to_category_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."game_system_categories"("id")
);

CREATE TABLE "game_system_to_mechanics" (
  "game_system_id" integer NOT NULL,
  "mechanics_id" integer NOT NULL,
  PRIMARY KEY ("game_system_id", "mechanics_id"),
  CONSTRAINT "game_system_to_mechanics_system_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id"),
  CONSTRAINT "game_system_to_mechanics_mechanic_fk" FOREIGN KEY ("mechanics_id") REFERENCES "public"."game_system_mechanics"("id")
);

CREATE TABLE "user_game_system_preferences" (
  "user_id" text NOT NULL,
  "game_system_id" integer NOT NULL,
  "preference_type" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "game_system_id"),
  CONSTRAINT "user_game_system_preferences_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_game_system_preferences_system_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE CASCADE,
  CONSTRAINT "user_game_system_preferences_preference_check" CHECK ("preference_type" IN ('favorite', 'avoid'))
);

CREATE TABLE "media_assets" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL,
  "public_id" varchar(255) NOT NULL,
  "secure_url" text NOT NULL,
  "width" integer,
  "height" integer,
  "format" varchar(50),
  "license" varchar(255),
  "license_url" varchar(255),
  "kind" varchar(50),
  "order_index" integer DEFAULT 0,
  "moderated" boolean NOT NULL DEFAULT false,
  "checksum" varchar(64),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "media_assets_game_system_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id")
);

CREATE TABLE "faqs" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "source" text,
  "is_cms_override" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "faqs_game_system_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id")
);

CREATE TABLE "external_category_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "category_id" integer NOT NULL,
  "confidence" integer NOT NULL DEFAULT 0,
  CONSTRAINT "external_category_map_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."game_system_categories"("id")
);

CREATE UNIQUE INDEX "external_category_map_source_tag_unique" ON "public"."external_category_map" ("source", "external_tag");

CREATE TABLE "external_mechanic_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "mechanic_id" integer NOT NULL,
  "confidence" integer NOT NULL DEFAULT 0,
  CONSTRAINT "external_mechanic_map_mechanic_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."game_system_mechanics"("id")
);

CREATE UNIQUE INDEX "external_mechanic_map_source_tag_unique" ON "public"."external_mechanic_map" ("source", "external_tag");

CREATE TABLE "system_crawl_events" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL,
  "source" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL,
  "started_at" timestamp NOT NULL,
  "finished_at" timestamp NOT NULL,
  "http_status" integer,
  "error_message" text,
  "severity" varchar(50) NOT NULL DEFAULT 'info',
  "details" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "system_crawl_events_game_system_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id")
);
