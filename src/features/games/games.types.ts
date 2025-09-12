import { z } from "zod";
import type { user } from "~/db/schema";
import type { gameSystems as gameSystem } from "~/db/schema/game-systems.schema";
import type { gameStatusEnum, games } from "~/db/schema/games.schema"; // Removed gameVisibilityEnum
import type { visibilityEnum } from "~/db/schema/shared.schema"; // Added visibilityEnum
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import {
  BaseParticipantWithUser,
  ParticipantRole,
  ParticipantStatus,
} from "~/shared/types/participants";

export type Game = typeof games.$inferSelect & {
  location: z.infer<typeof locationSchema>;
};
export type NewGame = typeof games.$inferInsert;

export type GameStatus = (typeof gameStatusEnum.enumValues)[number];
export type GameVisibility = (typeof visibilityEnum.enumValues)[number]; // Changed to visibilityEnum
export type GameParticipantRole = ParticipantRole;
export type GameParticipantStatus = ParticipantStatus;

export type GameWithDetails = Game & {
  owner: typeof user.$inferSelect | null;
  gameSystem: typeof gameSystem.$inferSelect;
  participants: GameParticipant[];
  minimumRequirements: z.infer<typeof minimumRequirementsSchema> | null;
  safetyRules: z.infer<typeof safetyRulesSchema> | null;
};

export type GameParticipant = BaseParticipantWithUser & {
  gameId: string;
  message?: string;
};

export type GameListItem = Game & {
  owner: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    uploadedAvatarPath?: string | null;
    gmRating?: number | null;
  } | null;
  gameSystem: { id: number; name: string } | null;
  participantCount: number;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema> | null;
  safetyRules: z.infer<typeof safetyRulesSchema> | null;
  campaignId: string | null;
};

export type GameSearchFilters = {
  gameSystemId?: number;
  status?: GameStatus;
  visibility?: GameVisibility;
  ownerId?: string;
  participantId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
};

import type { gameApplications } from "~/db/schema/games.schema";

export type GameApplication = typeof gameApplications.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type GameInvitation = {
  gameId: string;
  userId: string;
  email?: string;
  role: GameParticipantRole;
};

export type GameParticipantUpdate = {
  id: string;
  status?: GameParticipantStatus;
  role?: GameParticipantRole;
};

import type { applicationStatusEnum } from "~/db/schema/shared.schema";

export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
