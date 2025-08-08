// src/db/schema/shared.schema.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const participantStatusEnum = pgEnum("participant_status", [
  "approved",
  "rejected",
  "pending",
]);

export const participantRoleEnum = pgEnum("participant_role", [
  "owner",
  "player",
  "invited",
  "applicant",
]);
