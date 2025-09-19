CREATE TABLE IF NOT EXISTS "membership_payment_sessions" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "membership_type_id" varchar(255) NOT NULL,
  "square_checkout_id" varchar(255) NOT NULL,
  "square_payment_link_url" varchar(2048) NOT NULL,
  "square_order_id" varchar(255),
  "square_payment_id" varchar(255),
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" varchar(10) DEFAULT 'CAD' NOT NULL,
  "expires_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "membership_payment_sessions_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "membership_payment_sessions_membership_type_fk"
    FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "roles_name_unique" UNIQUE ("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "color" text,
  "icon" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tags_name_unique" UNIQUE ("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "role_id" text NOT NULL,
  "team_id" text,
  "event_id" text,
  "assigned_by" text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone,
  "notes" text,
  CONSTRAINT "user_roles_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "user_roles_role_id_roles_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade,
  CONSTRAINT "user_roles_assigned_by_user_id_fk"
    FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tags" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "tag_id" text NOT NULL,
  "assigned_by" text,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone,
  "notes" text,
  CONSTRAINT "user_tags_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
  CONSTRAINT "user_tags_tag_id_tags_id_fk"
    FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade,
  CONSTRAINT "user_tags_assigned_by_user_id_fk"
    FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_payment_sessions_user_idx"
  ON "membership_payment_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "membership_payment_sessions_checkout_idx"
  ON "membership_payment_sessions" USING btree ("square_checkout_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_payment_sessions_order_idx"
  ON "membership_payment_sessions" USING btree ("square_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_payment_sessions_payment_idx"
  ON "membership_payment_sessions" USING btree ("square_payment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_payment_sessions_type_idx"
  ON "membership_payment_sessions" USING btree ("membership_type_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id"
  ON "user_roles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_team_id"
  ON "user_roles" USING btree ("team_id")
  WHERE "user_roles"."team_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_event_id"
  ON "user_roles" USING btree ("event_id")
  WHERE "user_roles"."event_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_unique"
  ON "user_roles" USING btree ("user_id", "role_id", "team_id", "event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_tags_user_id"
  ON "user_tags" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_tags_tag_id"
  ON "user_tags" USING btree ("tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_tags_expires_at"
  ON "user_tags" USING btree ("expires_at")
  WHERE "user_tags"."expires_at" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_tags_unique"
  ON "user_tags" USING btree ("user_id", "tag_id");
