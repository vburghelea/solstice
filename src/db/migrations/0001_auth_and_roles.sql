-- Authentication core
CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "uploaded_avatar_path" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "profile_complete" boolean NOT NULL DEFAULT false,
  "gender" text,
  "pronouns" text,
  "phone" text,
  "city" text,
  "country" text,
  "languages" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "identity_tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "preferred_game_themes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "overall_experience_level" "public"."experience_level",
  "calendar_availability" jsonb NOT NULL DEFAULT '{"monday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"tuesday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"wednesday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"thursday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"friday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"saturday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"sunday":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]}'::jsonb,
  "privacy_settings" text,
  "notification_preferences" jsonb,
  "is_gm" boolean NOT NULL DEFAULT false,
  "games_hosted" integer NOT NULL DEFAULT 0,
  "average_response_time" integer,
  "response_rate" integer NOT NULL DEFAULT 0,
  "gm_style" text,
  "gm_rating" real,
  "profile_version" integer NOT NULL DEFAULT 1,
  "profile_updated_at" timestamp DEFAULT now(),
  CONSTRAINT "user_email_unique" UNIQUE ("email")
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL,
  CONSTRAINT "session_token_unique" UNIQUE ("token"),
  CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" text PRIMARY KEY,
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
  CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE
);

CREATE TABLE "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Role based access control
CREATE TABLE "roles" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "user_roles" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "role_id" text NOT NULL,
  "team_id" text,
  "event_id" text,
  "assigned_by" text NOT NULL,
  "assigned_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "notes" text,
  CONSTRAINT "user_roles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE,
  CONSTRAINT "user_roles_assigned_by_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id")
);

CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" ("user_id");
CREATE INDEX "idx_user_roles_team_id" ON "public"."user_roles" ("team_id") WHERE "team_id" IS NOT NULL;
CREATE INDEX "idx_user_roles_event_id" ON "public"."user_roles" ("event_id") WHERE "event_id" IS NOT NULL;
CREATE INDEX "idx_user_roles_unique" ON "public"."user_roles" ("user_id", "role_id", "team_id", "event_id");

CREATE TABLE "tags" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "description" text,
  "color" text,
  "icon" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "user_tags" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "tag_id" text NOT NULL,
  "assigned_by" text,
  "assigned_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "notes" text,
  CONSTRAINT "user_tags_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE,
  CONSTRAINT "user_tags_assigned_by_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id")
);

CREATE INDEX "idx_user_tags_user_id" ON "public"."user_tags" ("user_id");
CREATE INDEX "idx_user_tags_tag_id" ON "public"."user_tags" ("tag_id");
CREATE INDEX "idx_user_tags_expires_at" ON "public"."user_tags" ("expires_at") WHERE "expires_at" IS NOT NULL;
CREATE INDEX "idx_user_tags_unique" ON "public"."user_tags" ("user_id", "tag_id");
