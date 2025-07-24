-- Add membership_types table
CREATE TABLE "membership_types" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"price_cents" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add memberships table
CREATE TABLE "memberships" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"membership_type_id" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"payment_provider" varchar(100),
	"payment_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_type_id_membership_types_id_fk" 
  FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;

-- Add indexes for performance
CREATE INDEX "membership_types_status_idx" ON "membership_types" USING btree ("status");
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");
CREATE INDEX "memberships_end_date_idx" ON "memberships" USING btree ("end_date");
CREATE INDEX "memberships_payment_id_idx" ON "memberships" USING btree ("payment_id");

-- Seed initial membership type
INSERT INTO "membership_types" (id, name, description, price_cents, duration_months, status)
VALUES (
  'annual_player_2025', 
  'Annual Player Membership 2025',
  'Full player membership for the 2025 season including tournament eligibility and voting rights',
  4500, -- $45.00
  12,
  'active'
);