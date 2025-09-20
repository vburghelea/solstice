ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "invited_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "last_invitation_reminder_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "invitation_reminder_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "requested_at" timestamptz;
