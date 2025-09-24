-- Social graph and notification infrastructure
CREATE TYPE "public"."gm_strength" AS ENUM (
  'creativity',
  'world_builder',
  'inclusive',
  'rule_of_cool',
  'storytelling',
  'voices',
  'sets_the_mood',
  'teacher',
  'knows_the_rules',
  'visual_aid'
);

CREATE TYPE "public"."social_action" AS ENUM (
  'follow',
  'unfollow',
  'block',
  'unblock'
);

CREATE TABLE "user_follows" (
  "id" text PRIMARY KEY,
  "follower_id" text NOT NULL,
  "following_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_follows_follower_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_follows_following_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_follow" UNIQUE ("follower_id", "following_id")
);

CREATE TABLE "user_blocks" (
  "id" text PRIMARY KEY,
  "blocker_id" text NOT NULL,
  "blockee_id" text NOT NULL,
  "reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_blocks_blocker_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_blocks_blockee_id_fk" FOREIGN KEY ("blockee_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_blocks_unique" UNIQUE ("blocker_id", "blockee_id")
);

CREATE INDEX "user_blocks_blocker_idx" ON "public"."user_blocks" ("blocker_id");
CREATE INDEX "user_blocks_blockee_idx" ON "public"."user_blocks" ("blockee_id");

CREATE TABLE "gm_reviews" (
  "id" text PRIMARY KEY,
  "reviewer_id" text NOT NULL,
  "gm_id" text NOT NULL,
  "game_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "selected_strengths" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "comment" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "gm_reviews_reviewer_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "gm_reviews_gm_id_fk" FOREIGN KEY ("gm_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "gm_reviews_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE,
  CONSTRAINT "gm_review_unique_reviewer_per_game" UNIQUE ("reviewer_id", "game_id")
);

CREATE TABLE "social_audit_logs" (
  "id" text PRIMARY KEY,
  "actor_user_id" text,
  "target_user_id" text,
  "action" "public"."social_action" NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "social_audit_logs_actor_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL,
  CONSTRAINT "social_audit_logs_target_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL
);

CREATE INDEX "social_audit_logs_actor_idx" ON "public"."social_audit_logs" ("actor_user_id");
CREATE INDEX "social_audit_logs_target_idx" ON "public"."social_audit_logs" ("target_user_id");
CREATE INDEX "social_audit_logs_action_idx" ON "public"."social_audit_logs" ("action");

CREATE TABLE "email_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "dedupe_key" text NOT NULL,
  "type" varchar(100) NOT NULL,
  "entity_id" text,
  "recipient_email" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "email_events_dedupe_key_unique" UNIQUE ("dedupe_key")
);
