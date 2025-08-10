import {
  CampaignApplication,
  CampaignParticipant,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
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
