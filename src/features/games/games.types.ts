import { z } from "zod";
import type { user } from "~/db/schema";
import type { gameSystems as gameSystem } from "~/db/schema/game-systems.schema";
import type {
  gameParticipantRoleEnum,
  gameParticipantStatusEnum,
  gameStatusEnum,
  gameVisibilityEnum,
  games,
} from "~/db/schema/games.schema";
import { gameLocationSchema } from "./games.schemas";

export type Game = typeof games.$inferSelect & {
  location: z.infer<typeof gameLocationSchema>;
};
export type NewGame = typeof games.$inferInsert;

export type GameStatus = (typeof gameStatusEnum.enumValues)[number];
export type GameVisibility = (typeof gameVisibilityEnum.enumValues)[number];
export type GameParticipantRole = (typeof gameParticipantRoleEnum.enumValues)[number];
export type GameParticipantStatus = (typeof gameParticipantStatusEnum.enumValues)[number];

export interface GameLocation {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export type MinimumRequirements = {
  minPlayers?: number;
  maxPlayers?: number;
  languageLevel?: "beginner" | "intermediate" | "advanced" | "fluent";
  playerRadiusKm?: number;
};

export interface SafetyRules {
  [key: string]: boolean;
}

export type GameWithDetails = Game & {
  owner: typeof user.$inferSelect | null;
  gameSystem: typeof gameSystem.$inferSelect;
  participants: GameParticipant[];
  minimumRequirements: MinimumRequirements | null;
  safetyRules: SafetyRules | null;
};

export type GameParticipant = {
  id: string;
  gameId: string;
  userId: string;
  role: GameParticipantRole;
  status: GameParticipantStatus;
  user: typeof user.$inferSelect;
  message?: string;
};

export type GameListItem = Game & {
  owner: { id: string; name: string | null; email: string } | null;
  gameSystem: { id: number; name: string } | null;
  participantCount: number;
  minimumRequirements: MinimumRequirements | null;
  safetyRules: SafetyRules | null;
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

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { code: string; message: string; field?: string }[] };
