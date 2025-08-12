import {
  CampaignApplication,
  CampaignParticipant,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
import { MOCK_GAME_SYSTEM } from "./game-systems"; // Import MOCK_GAME_SYSTEM
import {
  MOCK_INVITED_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
  MOCK_PLAYER_USER,
} from "./users";

export const MOCK_CAMPAIGN: CampaignWithDetails = {
  id: "campaign-1",
  ownerId: MOCK_OWNER_USER.id,
  gameSystemId: 1,
  gameSystem: MOCK_GAME_SYSTEM, // Add gameSystem here
  name: "Test Campaign",
  description: "A test campaign session",
  images: [],
  recurrence: "weekly",
  timeOfDay: "evenings",
  sessionDuration: 240,
  pricePerSession: null,
  language: "English",
  location: { address: "Test Location", lat: 0, lng: 0 },
  status: "active",
  minimumRequirements: { languageLevel: "beginner" },
  visibility: "public",
  safetyRules: { "no-alcohol": true, "safe-word": false },
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: MOCK_OWNER_USER,
  participants: [],
  applications: [],
  participantCount: 5,
};

export const MOCK_OWNER_PARTICIPANT: CampaignParticipant = {
  id: "part-owner-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_OWNER_USER.id,
  user: MOCK_OWNER_USER,
  role: "owner",
  status: "approved",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_PLAYER_PARTICIPANT: CampaignParticipant = {
  id: "part-player-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_PLAYER_USER.id,
  user: MOCK_PLAYER_USER,
  role: "player",
  status: "approved",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_INVITED_PARTICIPANT: CampaignParticipant = {
  id: "part-invited-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_INVITED_USER.id,
  user: MOCK_INVITED_USER,
  role: "invited",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_APPLICANT_APPLICATION: CampaignApplication = {
  id: "app-applicant-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_OTHER_USER.id,
  status: "pending",
  user: MOCK_OTHER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_CAMPAIGN_PARTICIPANT_1: CampaignParticipant = {
  id: "participant-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: "user-1",
  role: "player",
  status: "approved",
  user: MOCK_PLAYER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_CAMPAIGN_PARTICIPANT_2: CampaignParticipant = {
  id: "participant-2",
  campaignId: MOCK_CAMPAIGN.id,
  userId: "user-2",
  role: "player",
  status: "approved",
  user: MOCK_PLAYER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

import { vi } from "vitest";

export const MOCK_CAMPAIGN_APPLICATION_PENDING = {
  id: "app-pending-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: "user-non-owner",
  user: {
    ...MOCK_OWNER_USER,
    id: "user-non-owner",
    name: "Non Owner",
    email: "nonowner@example.com",
  },
  status: "pending" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_CAMPAIGN_APPLICATION_REJECTED = {
  id: "app-rejected-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: "user-non-owner",
  user: {
    ...MOCK_OWNER_USER,
    id: "user-non-owner",
    name: "Non Owner",
    email: "nonowner@example.com",
  },
  status: "rejected" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_APPLICATIONS = [
  {
    id: "app-1",
    campaignId: MOCK_CAMPAIGN.id,
    userId: "user-2",
    user: { ...MOCK_OWNER_USER, id: "user-2", name: "Alice", email: "alice@example.com" },
    status: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "app-2",
    campaignId: MOCK_CAMPAIGN.id,
    userId: "user-3",
    user: { ...MOCK_OWNER_USER, id: "user-3", name: "Bob", email: "bob@example.com" },
    status: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Top-level mocks for campaigns.mutations
export const mockApplyToCampaign = vi.fn().mockResolvedValue({
  success: true,
  data: MOCK_CAMPAIGN_APPLICATION_PENDING,
});
export const mockRespondToApplication = vi.fn().mockResolvedValue({
  success: true,
  data: MOCK_CAMPAIGN_APPLICATION_PENDING,
});
export const mockCreateCampaign = vi.fn();
export const mockDeleteCampaign = vi.fn();
export const mockInviteToCampaign = vi.fn();
export const mockRemoveCampaignParticipant = vi.fn();
export const mockUpdateCampaign = vi.fn();
export const mockUpdateCampaignParticipant = vi.fn();
export const mockRemoveCampaignParticipantBan = vi.fn();

// Top-level mocks for campaigns.queries
export const mockGetCampaign = vi
  .fn()
  .mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });
export const mockGetCampaignApplications = vi
  .fn()
  .mockResolvedValue({ success: true, data: [] });
export const mockGetCampaignApplicationForUser = vi
  .fn()
  .mockResolvedValue({ success: true, data: null });
export const mockGetCampaignParticipants = vi.fn();
export const mockListCampaigns = vi.fn();
export const mockSearchUsersForInvitation = vi.fn();

vi.mock("~/features/campaigns/campaigns.mutations", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/features/campaigns/campaigns.mutations")>();
  return {
    ...actual,
    applyToCampaign: mockApplyToCampaign,
    respondToApplication: mockRespondToApplication,
    createCampaign: mockCreateCampaign,
    deleteCampaign: mockDeleteCampaign,
    inviteToCampaign: mockInviteToCampaign,
    removeCampaignParticipant: mockRemoveCampaignParticipant,
    updateCampaign: mockUpdateCampaign,
    updateCampaignParticipant: mockUpdateCampaignParticipant,
    removeCampaignParticipantBan: mockRemoveCampaignParticipantBan,
  };
});

vi.mock("~/features/campaigns/campaigns.queries", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/features/campaigns/campaigns.queries")>();
  return {
    ...actual,
    getCampaign: mockGetCampaign,
    getCampaignApplications: mockGetCampaignApplications,
    getCampaignApplicationForUser: mockGetCampaignApplicationForUser,
    getCampaignParticipants: mockGetCampaignParticipants,
    listCampaigns: mockListCampaigns,
    searchUsersForInvitation: mockSearchUsersForInvitation,
  };
});

export const setupCampaignMocks = () => {
  // Reset mocks to their initial state for each test
  mockApplyToCampaign
    .mockReset()
    .mockResolvedValue({ success: true, data: MOCK_CAMPAIGN_APPLICATION_PENDING });
  mockRespondToApplication
    .mockReset()
    .mockResolvedValue({ success: true, data: MOCK_CAMPAIGN_APPLICATION_PENDING });
  mockCreateCampaign.mockReset();
  mockDeleteCampaign.mockReset();
  mockInviteToCampaign.mockReset();
  mockRemoveCampaignParticipant.mockReset();
  mockUpdateCampaign.mockReset();
  mockUpdateCampaignParticipant.mockReset();
  mockRemoveCampaignParticipantBan.mockReset();

  mockGetCampaign.mockReset().mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });
  mockGetCampaignApplications.mockReset().mockResolvedValue({ success: true, data: [] });
  mockGetCampaignApplicationForUser
    .mockReset()
    .mockResolvedValue({ success: true, data: null });
  mockGetCampaignParticipants.mockReset();
  mockListCampaigns.mockReset();
  mockSearchUsersForInvitation.mockReset();

  return {
    mockApplyToCampaign,
    mockRespondToApplication,
    mockGetCampaign,
    mockGetCampaignApplications,
    mockGetCampaignApplicationForUser,
    mockCreateCampaign,
    mockDeleteCampaign,
    mockInviteToCampaign,
    mockRemoveCampaignParticipant,
    mockUpdateCampaign,
    mockUpdateCampaignParticipant,
    mockGetCampaignParticipants,
    mockListCampaigns,
    mockSearchUsersForInvitation,
    mockRemoveCampaignParticipantBan,
  };
};
