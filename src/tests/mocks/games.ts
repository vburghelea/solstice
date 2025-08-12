import {
  GameListItem,
  GameParticipant,
  GameWithDetails,
} from "~/features/games/games.types";
import { MOCK_CAMPAIGN } from "./campaigns";
import { MOCK_GAME_SYSTEM, MOCK_GAME_SYSTEM_2, MOCK_GAME_SYSTEM_3 } from "./game-systems";
import {
  MOCK_INVITED_USER,
  MOCK_NON_OWNER_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
  MOCK_PLAYER_USER,
} from "./users";

export const MOCK_GAME: GameWithDetails = {
  id: "game-1",
  ownerId: MOCK_OWNER_USER.id,
  owner: MOCK_OWNER_USER,
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
  gameSystem: MOCK_GAME_SYSTEM,
  participants: [],
};

export const MOCK_GAME_CANCELED: GameWithDetails = {
  ...MOCK_GAME,
  id: "game-cancelled",
  campaignId: null,
  status: "canceled",
  participants: [],
};

export const MOCK_GAME_COMPLETED: GameWithDetails = {
  ...MOCK_GAME,
  id: "game-cIompleted",
  campaignId: null,
  status: "completed",
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
  gameSystem: MOCK_GAME_SYSTEM, // Explicitly add gameSystem
};
export const MOCK_CAMPAIGN_GAME_2: GameListItem = {
  ...MOCK_GAME,
  id: "game-camp-2",
  campaignId: MOCK_CAMPAIGN.id,
  status: "completed",
  participantCount: 0,
  gameSystem: MOCK_GAME_SYSTEM_2, // Assign MOCK_GAME_SYSTEM_2
};
export const MOCK_CAMPAIGN_GAME_3: GameListItem = {
  ...MOCK_GAME,
  id: "game-camp-3",
  campaignId: MOCK_CAMPAIGN.id,
  status: "canceled",
  participantCount: 0,
  gameSystem: MOCK_GAME_SYSTEM_3, // Assign MOCK_GAME_SYSTEM_3
};

import { vi } from "vitest";

// Mock application data
export const MOCK_GAME_APPLICATION_PENDING = {
  id: "game-app-pending-1",
  gameId: MOCK_GAME.id,
  userId: "non-owner-test-user-id",
  user: {
    ...MOCK_NON_OWNER_USER,
    id: "non-owner-test-user-id",
    name: MOCK_NON_OWNER_USER.name,
    email: MOCK_NON_OWNER_USER.email,
  },
  status: "pending" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_GAME_APPLICATION_REJECTED = {
  id: "game-app-rejected-1",
  gameId: MOCK_GAME.id,
  userId: "non-owner-test-user-id",
  user: {
    ...MOCK_NON_OWNER_USER,
    id: "non-owner-test-user-id",
    name: MOCK_NON_OWNER_USER.name,
    email: MOCK_NON_OWNER_USER.email,
  },
  status: "rejected" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Top-level mocks for games.mutations
export const mockApplyToGame = vi.fn().mockImplementation(() => {
  return { success: true, data: MOCK_GAME_APPLICATION_PENDING };
});
export const mockRespondToGameApplication = vi.fn().mockImplementation(({ data }) => {
  const updatedApplication = {
    ...MOCK_GAME_APPLICATION_PENDING, // Start with the pending application
    status: data.status, // Update the status based on the input
  };
  // Update the mock for getGameApplications to reflect the new status
  mockGetGameApplications.mockResolvedValue({
    success: true,
    data: [updatedApplication],
  });
  return { success: true, data: updatedApplication };
});
export const mockCreateGame = vi.fn();
export const mockDeleteGame = vi.fn();
export const mockInviteToGame = vi.fn();
export const mockRemoveGameParticipant = vi.fn();
export const mockUpdateGame = vi.fn();
export const mockUpdateGameParticipant = vi.fn();
export const mockUpdateGameSessionStatus = vi.fn();
export const mockRemoveGameParticipantBan = vi.fn();

// Top-level mocks for games.queries
export const mockGetGame = vi.fn().mockResolvedValue({ success: true, data: MOCK_GAME });
export const mockGetGameApplications = vi
  .fn()
  .mockResolvedValue({ success: true, data: [] });
export const mockGetGameApplicationForUser = vi
  .fn()
  .mockResolvedValue({ success: true, data: null });
export const mockGetGameParticipants = vi
  .fn()
  .mockResolvedValue({ success: true, data: [] });
export const mockListGames = vi.fn();
export const mockSearchUsersForInvitation = vi.fn();
export const mockListGameSessionsByCampaignId = vi.fn().mockResolvedValue({
  success: true,
  data: [MOCK_CAMPAIGN_GAME_1, MOCK_CAMPAIGN_GAME_2, MOCK_CAMPAIGN_GAME_3],
});
export const mockGetGameSystem = vi
  .fn()
  .mockResolvedValue({ success: true, data: MOCK_GAME_SYSTEM });
export const mockSearchGameSystems = vi
  .fn()
  .mockResolvedValue({ success: true, data: [] });

vi.mock("~/features/games/games.mutations", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/features/games/games.mutations")>();
  return {
    ...actual,
    applyToGame: mockApplyToGame,
    respondToGameApplication: mockRespondToGameApplication,
    createGame: mockCreateGame,
    deleteGame: mockDeleteGame,
    inviteToGame: mockInviteToGame,
    removeGameParticipant: mockRemoveGameParticipant,
    updateGame: mockUpdateGame,
    updateGameParticipant: mockUpdateGameParticipant,
    updateGameSessionStatus: mockUpdateGameSessionStatus,
    removeGameParticipantBan: mockRemoveGameParticipantBan,
  };
});

vi.mock("~/features/games/games.queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/games/games.queries")>();
  return {
    ...actual,
    getGame: mockGetGame,
    getGameApplications: mockGetGameApplications,
    getGameApplicationForUser: mockGetGameApplicationForUser,
    getGameParticipants: mockGetGameParticipants,
    listGames: mockListGames,
    searchUsersForInvitation: mockSearchUsersForInvitation,
    listGameSessionsByCampaignId: mockListGameSessionsByCampaignId,
    getGameSystem: mockGetGameSystem,
    searchGameSystems: mockSearchGameSystems,
  };
});

export const setupGameMocks = () => {
  // Reset mocks to their initial state for each test, but allow test-specific overrides
  mockApplyToGame.mockImplementation(async () => {
    mockGetGameApplicationForUser.mockResolvedValue({
      success: true,
      data: MOCK_GAME_APPLICATION_PENDING,
    });
    return { success: true, data: MOCK_GAME_APPLICATION_PENDING };
  });
  mockRespondToGameApplication.mockImplementation(async ({ data }) => {
    const updatedApplication = {
      ...MOCK_GAME_APPLICATION_PENDING,
      status: data.status,
    };
    mockGetGameApplications.mockResolvedValue({
      success: true,
      data: [updatedApplication],
    });
    return { success: true, data: updatedApplication };
  });
  // mockRespondToGameApplication is already mocked at the top level with implementation
  mockCreateGame.mockReset();
  mockDeleteGame.mockReset();
  mockInviteToGame.mockReset();
  mockRemoveGameParticipant.mockReset();
  mockUpdateGame.mockReset();
  mockUpdateGameParticipant.mockReset();
  mockUpdateGameSessionStatus.mockReset();
  mockRemoveGameParticipantBan.mockReset();

  mockGetGame.mockReset().mockResolvedValue({
    success: true,
    data: {
      ...MOCK_GAME,
      owner: MOCK_OWNER_USER,
      participants: [],
    },
  });
  mockGetGameApplications.mockReset().mockResolvedValue({ success: true, data: [] });
  mockGetGameApplicationForUser
    .mockReset()
    .mockResolvedValue({ success: true, data: null }); // Ensure this is reset to default null

  mockGetGameParticipants.mockReset();
  mockListGames.mockReset();
  mockSearchUsersForInvitation.mockReset();
  mockListGameSessionsByCampaignId.mockReset();
  mockGetGameSystem
    .mockReset()
    .mockResolvedValue({ success: true, data: MOCK_GAME_SYSTEM });
  mockSearchGameSystems.mockReset().mockResolvedValue({ success: true, data: [] });

  return {
    mockApplyToGame,
    mockRespondToGameApplication,
    mockGetGame,
    mockGetGameApplications,
    mockGetGameApplicationForUser,
    mockCreateGame,
    mockDeleteGame,
    mockInviteToGame,
    mockRemoveGameParticipant,
    mockUpdateGame,
    mockUpdateGameParticipant,
    mockUpdateGameSessionStatus,
    mockGetGameParticipants,
    mockListGames,
    mockSearchUsersForInvitation,
    mockListGameSessionsByCampaignId,
    mockGetGameSystem,
    mockSearchGameSystems,
    mockRemoveGameParticipantBan,
  };
};
