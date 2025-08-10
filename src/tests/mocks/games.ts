import { GameSystem } from "~/db";
import {
  GameListItem,
  GameParticipant,
  GameWithDetails,
} from "~/features/games/games.types";
import { MOCK_CAMPAIGN } from "./campaigns";
import {
  MOCK_INVITED_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
  MOCK_PLAYER_USER,
} from "./users";

export const MOCK_GAME_SYSTEM: GameSystem = {
  id: 1,
  name: "Test System",
  slug: "test-system",
  description: "A test game system",
  images: [],
  minPlayers: 1,
  maxPlayers: 10,
  optimalPlayers: 4,
  averagePlayTime: 120,
  ageRating: "10+",
  complexityRating: "medium",
  yearReleased: 2020,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_GAME: GameWithDetails = {
  id: "game-1",
  ownerId: MOCK_OWNER_USER.id,
  campaignId: null,
  gameSystemId: MOCK_GAME_SYSTEM.id,
  name: "Test Game",
  dateTime: new Date(),
  description: "A test game session",
  expectedDuration: 120,
  price: 0,
  language: "English",
  location: { address: "Test Location", lat: 0, lng: 0 },
  status: "scheduled",
  minimumRequirements: {},
  visibility: "public",
  safetyRules: { "no-alcohol": false, "safe-word": false },
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: MOCK_OWNER_USER,
  gameSystem: MOCK_GAME_SYSTEM,
  participants: [],
};

export const MOCK_GAME_CAMPAIGN: GameWithDetails = {
  ...MOCK_GAME,
  campaignId: MOCK_CAMPAIGN.id,
};

export const MOCK_OWNER_GAME_PARTICIPANT: GameParticipant = {
  id: "part-owner-1",
  gameId: MOCK_GAME.id,
  userId: MOCK_OWNER_USER.id,
  role: "player",
  status: "approved",
  user: MOCK_OWNER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_INVITED_GAME_PARTICIPANT: GameParticipant = {
  id: "part-invited-1",
  gameId: MOCK_GAME.id,
  userId: MOCK_INVITED_USER.id,
  role: "invited",
  status: "pending",
  user: MOCK_INVITED_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_PLAYER_GAME_PARTICIPANT: GameParticipant = {
  id: "part-player-1",
  gameId: MOCK_GAME.id,
  userId: MOCK_PLAYER_USER.id,
  role: "player",
  status: "approved",
  user: MOCK_PLAYER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_APPLICANT_GAME_PARTICIPANT: GameParticipant = {
  id: "part-applicant-1",
  gameId: MOCK_GAME.id,
  userId: MOCK_OTHER_USER.id,
  role: "applicant",
  status: "pending",
  user: MOCK_OTHER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_CAMPAIGN_GAME_1: GameListItem = {
  ...MOCK_GAME,
  id: "game-camp-1",
  campaignId: MOCK_CAMPAIGN.id,
  status: "scheduled",
  participantCount: 0,
};
export const MOCK_CAMPAIGN_GAME_2: GameListItem = {
  ...MOCK_GAME,
  id: "game-camp-2",
  campaignId: MOCK_CAMPAIGN.id,
  status: "completed",
  participantCount: 0,
};
export const MOCK_CAMPAIGN_GAME_3: GameListItem = {
  ...MOCK_GAME,
  id: "game-camp-3",
  campaignId: MOCK_CAMPAIGN.id,
  status: "canceled",
  participantCount: 0,
};
