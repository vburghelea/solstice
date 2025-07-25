CREATE TABLE "game_system_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	CONSTRAINT "game_system_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_system_mechanics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	CONSTRAINT "game_system_mechanics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_system_to_category" (
	"game_system_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "game_system_to_category_game_system_id_category_id_pk" PRIMARY KEY("game_system_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "game_system_to_mechanics" (
	"game_system_id" integer NOT NULL,
	"mechanics_id" integer NOT NULL,
	CONSTRAINT "game_system_to_mechanics_game_system_id_mechanics_id_pk" PRIMARY KEY("game_system_id","mechanics_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
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
  "moderated" boolean DEFAULT false NOT NULL,
  "checksum" varchar(64),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faqs" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "source" text,
  "is_cms_override" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_category_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "category_id" integer NOT NULL REFERENCES "game_system_categories"("id"),
  "confidence" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "external_category_map_source_tag_unique" UNIQUE ("source", "external_tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_mechanic_map" (
  "id" serial PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "external_tag" varchar(255) NOT NULL,
  "mechanic_id" integer NOT NULL REFERENCES "game_system_mechanics"("id"),
  "confidence" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "external_mechanic_map_source_tag_unique" UNIQUE ("source", "external_tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_crawl_events" (
  "id" serial PRIMARY KEY,
  "game_system_id" integer NOT NULL,
  "source" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL,
  "severity" varchar(50) DEFAULT 'info' NOT NULL,
  "details" jsonb,
  "started_at" timestamp NOT NULL,
  "finished_at" timestamp NOT NULL,
  "http_status" integer,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description_scraped" text,
	"description_cms" text,
	"images" text[],
	"min_players" integer,
	"max_players" integer,
	"optimal_players" integer,
	"average_play_time" integer,
	"age_rating" varchar(50),
	"complexity_rating" varchar(50),
	"year_released" integer,
	"release_date" date,
	"publisher_id" integer REFERENCES "publishers"("id"),
	"publisher_url" varchar(255),
	"hero_image_id" integer REFERENCES "media_assets"("id"),
	"source_of_truth" text,
	"external_refs" jsonb,
	"crawl_status" varchar(50),
	"last_crawled_at" timestamp,
	"last_success_at" timestamp,
	"error_message" text,
	"cms_version" integer DEFAULT 1,
	"cms_approved" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"last_approved_at" timestamp,
	"last_approved_by" text REFERENCES "user"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_systems_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_game_system_preferences" (
	"user_id" text NOT NULL,
	"game_system_id" integer NOT NULL,
	"preference_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_game_system_preferences_user_id_game_system_id_pk" PRIMARY KEY("user_id","game_system_id")
);
--> statement-breakpoint
ALTER TABLE "game_system_to_category" ADD CONSTRAINT "game_system_to_category_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_system_to_category" ADD CONSTRAINT "game_system_to_category_category_id_game_system_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."game_system_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_system_to_mechanics" ADD CONSTRAINT "game_system_to_mechanics_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_system_to_mechanics" ADD CONSTRAINT "game_system_to_mechanics_mechanics_id_game_system_mechanics_id_fk" FOREIGN KEY ("mechanics_id") REFERENCES "public"."game_system_mechanics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_system_preferences" ADD CONSTRAINT "user_game_system_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_system_preferences" ADD CONSTRAINT "user_game_system_preferences_game_system_id_game_systems_id_fk" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "system_crawl_events" ADD CONSTRAINT "system_crawl_events_game_system_id_game_systems_id" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_game_system_id_game_systems_id" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_game_system_id_game_systems_id" FOREIGN KEY ("game_system_id") REFERENCES "public"."game_systems"("id") ON DELETE no action ON UPDATE no action;
