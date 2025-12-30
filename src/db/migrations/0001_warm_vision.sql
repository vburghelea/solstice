CREATE TYPE "public"."checkout_item_type" AS ENUM('event_registration', 'membership_purchase', 'addon');--> statement-breakpoint
CREATE TYPE "public"."checkout_provider" AS ENUM('square', 'etransfer');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_status" AS ENUM('pending', 'completed', 'cancelled', 'failed', 'refunded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_purchase_status" AS ENUM('pending', 'active', 'expired', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."registration_group_member_role" AS ENUM('captain', 'member');--> statement-breakpoint
CREATE TYPE "public"."registration_group_member_status" AS ENUM('invited', 'pending', 'active', 'declined', 'removed');--> statement-breakpoint
CREATE TYPE "public"."registration_group_status" AS ENUM('draft', 'pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."registration_group_type" AS ENUM('individual', 'pair', 'team', 'relay', 'family');--> statement-breakpoint
CREATE TYPE "public"."registration_invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "checkout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"checkout_session_id" varchar(255) NOT NULL,
	"item_type" "checkout_item_type" NOT NULL,
	"description" varchar(500),
	"quantity" integer DEFAULT 1 NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'CAD' NOT NULL,
	"event_registration_id" uuid,
	"membership_purchase_id" uuid,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "checkout_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "checkout_provider" DEFAULT 'square' NOT NULL,
	"provider_checkout_id" varchar(255) NOT NULL,
	"provider_checkout_url" varchar(2048),
	"provider_order_id" varchar(255),
	"provider_payment_id" varchar(255),
	"status" "checkout_session_status" DEFAULT 'pending' NOT NULL,
	"amount_total_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'CAD' NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "membership_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"membership_type_id" varchar(255) NOT NULL,
	"user_id" text,
	"email" varchar(255),
	"event_id" uuid,
	"registration_group_member_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "membership_purchase_status" DEFAULT 'active' NOT NULL,
	"payment_provider" varchar(100),
	"payment_id" varchar(255),
	"membership_id" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "registration_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" text,
	"email" varchar(255),
	"role" "registration_group_member_role" DEFAULT 'member' NOT NULL,
	"status" "registration_group_member_status" DEFAULT 'pending' NOT NULL,
	"roster_metadata" jsonb,
	"invited_by_user_id" text,
	"invited_at" timestamp,
	"joined_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "registration_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"event_id" uuid NOT NULL,
	"group_type" "registration_group_type" NOT NULL,
	"status" "registration_group_status" DEFAULT 'draft' NOT NULL,
	"captain_user_id" text NOT NULL,
	"team_id" text,
	"min_size" integer,
	"max_size" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "registration_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"group_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"status" "registration_invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"accepted_by_user_id" text,
	"accepted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "registration_group_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "allow_waitlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "require_membership" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_event_registration_id_event_registrations_id_fk" FOREIGN KEY ("event_registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_membership_purchase_id_membership_purchases_id_fk" FOREIGN KEY ("membership_purchase_id") REFERENCES "public"."membership_purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_membership_type_id_membership_types_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_registration_group_member_id_registration_group_members_id_fk" FOREIGN KEY ("registration_group_member_id") REFERENCES "public"."registration_group_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_purchases" ADD CONSTRAINT "membership_purchases_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_group_members" ADD CONSTRAINT "registration_group_members_group_id_registration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."registration_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_group_members" ADD CONSTRAINT "registration_group_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_group_members" ADD CONSTRAINT "registration_group_members_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_groups" ADD CONSTRAINT "registration_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_groups" ADD CONSTRAINT "registration_groups_captain_user_id_user_id_fk" FOREIGN KEY ("captain_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_groups" ADD CONSTRAINT "registration_groups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_invites" ADD CONSTRAINT "registration_invites_group_id_registration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."registration_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_invites" ADD CONSTRAINT "registration_invites_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_items_session_idx" ON "checkout_items" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "checkout_items_event_reg_idx" ON "checkout_items" USING btree ("event_registration_id");--> statement-breakpoint
CREATE INDEX "checkout_items_membership_idx" ON "checkout_items" USING btree ("membership_purchase_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_user_idx" ON "checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkout_sessions_payment_idx" ON "checkout_sessions" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_sessions_provider_checkout_idx" ON "checkout_sessions" USING btree ("provider_checkout_id");--> statement-breakpoint
CREATE INDEX "membership_purchases_type_idx" ON "membership_purchases" USING btree ("membership_type_id");--> statement-breakpoint
CREATE INDEX "membership_purchases_user_idx" ON "membership_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_purchases_event_idx" ON "membership_purchases" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "membership_purchases_membership_idx" ON "membership_purchases" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "membership_purchases_payment_idx" ON "membership_purchases" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "registration_group_members_group_idx" ON "registration_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "registration_group_members_user_idx" ON "registration_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_group_members_group_user_idx" ON "registration_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_group_members_group_email_idx" ON "registration_group_members" USING btree ("group_id","email");--> statement-breakpoint
CREATE INDEX "registration_groups_event_idx" ON "registration_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "registration_groups_captain_idx" ON "registration_groups" USING btree ("captain_user_id");--> statement-breakpoint
CREATE INDEX "registration_groups_team_idx" ON "registration_groups" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "registration_invites_group_idx" ON "registration_invites" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_invites_token_idx" ON "registration_invites" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_registration_group_id_registration_groups_id_fk" FOREIGN KEY ("registration_group_id") REFERENCES "public"."registration_groups"("id") ON DELETE no action ON UPDATE no action;