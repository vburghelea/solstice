// src/shared/types/participants.ts
import type { user } from "~/db/schema/auth.schema";
import { participantRoleEnum, participantStatusEnum } from "~/db/schema/shared.schema";

export type ParticipantStatus = (typeof participantStatusEnum.enumValues)[number];
export type ParticipantRole = (typeof participantRoleEnum.enumValues)[number];

// Base participant type with common Drizzle fields
export interface BaseParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Base participant type including the associated user data
export interface BaseParticipantWithUser extends BaseParticipant {
  user: typeof user.$inferSelect;
}
