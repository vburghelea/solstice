-- Membership plans and payments
CREATE TABLE "membership_types" (
  "id" varchar(255) PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "description" varchar(1000),
  "price_cents" integer NOT NULL,
  "duration_months" integer NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'active',
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "membership_types_status_idx" ON "public"."membership_types" ("status");

CREATE TABLE "memberships" (
  "id" varchar(255) PRIMARY KEY,
  "user_id" text NOT NULL,
  "membership_type_id" varchar(255) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'active',
  "payment_provider" varchar(100),
  "payment_id" varchar(255),
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "memberships_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "memberships_membership_type_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id")
);

CREATE INDEX "memberships_user_id_idx" ON "public"."memberships" ("user_id");
CREATE INDEX "memberships_status_idx" ON "public"."memberships" ("status");
CREATE INDEX "memberships_end_date_idx" ON "public"."memberships" ("end_date");
CREATE INDEX "memberships_payment_id_idx" ON "public"."memberships" ("payment_id");

CREATE TABLE "membership_payment_sessions" (
  "id" varchar(255) PRIMARY KEY,
  "user_id" text NOT NULL,
  "membership_type_id" varchar(255) NOT NULL,
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
  CONSTRAINT "membership_payment_sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_payment_sessions_type_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id")
);

CREATE INDEX "membership_payment_sessions_user_idx" ON "public"."membership_payment_sessions" ("user_id");
CREATE UNIQUE INDEX "membership_payment_sessions_checkout_idx" ON "public"."membership_payment_sessions" ("square_checkout_id");
CREATE INDEX "membership_payment_sessions_order_idx" ON "public"."membership_payment_sessions" ("square_order_id");
CREATE INDEX "membership_payment_sessions_payment_idx" ON "public"."membership_payment_sessions" ("square_payment_id");
CREATE INDEX "membership_payment_sessions_type_idx" ON "public"."membership_payment_sessions" ("membership_type_id");
