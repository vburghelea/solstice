-- Migration: Add unique index on memberships (payment_provider, payment_id) to prevent duplicate payments
-- This prevents replay attacks by ensuring the same payment ID cannot be used twice

CREATE UNIQUE INDEX IF NOT EXISTS "memberships_payment_provider_id_unique"
ON "memberships" ("payment_provider", "payment_id")
WHERE "memberships"."payment_id" IS NOT NULL;

-- Also add a simple index on payment_id for faster lookups
CREATE INDEX IF NOT EXISTS "memberships_payment_id_idx"
ON "memberships" ("payment_id");
