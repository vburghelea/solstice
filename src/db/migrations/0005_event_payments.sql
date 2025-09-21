ALTER TABLE "events"
  ADD COLUMN "allow_etransfer" boolean NOT NULL DEFAULT false,
  ADD COLUMN "etransfer_instructions" text,
  ADD COLUMN "etransfer_recipient" varchar(255);

ALTER TABLE "event_registrations"
  ADD COLUMN "payment_method" varchar(50) NOT NULL DEFAULT 'square',
  ADD COLUMN "amount_due_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN "amount_paid_cents" integer,
  ADD COLUMN "payment_completed_at" timestamp,
  ADD COLUMN "payment_metadata" jsonb;

CREATE TABLE "event_payment_sessions" (
  "id" varchar(255) PRIMARY KEY,
  "registration_id" uuid NOT NULL REFERENCES "event_registrations"("id") ON DELETE CASCADE,
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
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
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "event_payment_sessions_checkout_idx"
  ON "event_payment_sessions" ("square_checkout_id");

CREATE INDEX "event_payment_sessions_payment_idx"
  ON "event_payment_sessions" ("square_payment_id");

CREATE INDEX "event_payment_sessions_registration_idx"
  ON "event_payment_sessions" ("registration_id");

CREATE INDEX "event_payment_sessions_event_idx"
  ON "event_payment_sessions" ("event_id");

CREATE INDEX "event_payment_sessions_user_idx"
  ON "event_payment_sessions" ("user_id");
