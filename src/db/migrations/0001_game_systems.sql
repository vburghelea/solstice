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
CREATE TABLE "game_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"description" text,
	"images" text[],
	"min_players" integer,
	"max_players" integer,
	"optimal_players" integer,
	"average_play_time" integer,
	"age_rating" varchar(50),
	"complexity_rating" varchar(50),
	"year_released" integer,
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