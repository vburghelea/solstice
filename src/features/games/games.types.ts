import { z } from "zod";
import type { user } from "~/db/schema";
import type { gameSystems as gameSystem } from "~/db/schema/game-systems.schema";
import type { gameStatusEnum, gameVisibilityEnum, games } from "~/db/schema/games.schema";
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
export type GameVisibility = (typeof gameVisibilityEnum.enumValues)[number];
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
  owner: { id: string; name: string | null; email: string } | null;
  gameSystem: { id: number; name: string } | null;
  participantCount: number;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema> | null;
  safetyRules: z.infer<typeof safetyRulesSchema> | null;
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

export type GameApplication = {
  gameId: string;
  userId: string;
  status: GameParticipantStatus;
  role: GameParticipantRole;
  message?: string;
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
