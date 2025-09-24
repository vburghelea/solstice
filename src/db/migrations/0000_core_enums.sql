CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared enumerations used across multiple domains
CREATE TYPE "public"."experience_level" AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TYPE "public"."participant_status" AS ENUM (
  'approved',
  'rejected',
  'pending'
);

CREATE TYPE "public"."participant_role" AS ENUM (
  'owner',
  'player',
  'invited',
  'applicant'
);

CREATE TYPE "public"."visibility" AS ENUM (
  'public',
  'protected',
  'private'
);

CREATE TYPE "public"."application_status" AS ENUM (
  'pending',
  'approved',
  'rejected'
);
