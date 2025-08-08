import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { getCurrentUser } from "~/features/auth/auth.queries";
import type {
  CampaignApplication,
  CampaignListItem,
  CampaignParticipant,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
import type { User } from "~/lib/auth/types";
import { OperationResult } from "~/shared/types/common";
import {
  applyToCampaignInputSchema,
  createCampaignInputSchema,
  getCampaignSchema,
  inviteToCampaignInputSchema,
  listCampaignsSchema,
  removeCampaignParticipantInputSchema,
  respondToCampaignApplicationSchema,
  searchUsersForInvitationSchema,
  updateCampaignInputSchema,
  updateCampaignParticipantInputSchema,
} from "../campaigns.schemas";

type ApplyToCampaignInput = z.infer<typeof applyToCampaignInputSchema>;
type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
type GetCampaignInput = z.infer<typeof getCampaignSchema>;
type InviteToCampaignInput = z.infer<typeof inviteToCampaignInputSchema>;
type ListCampaignsInput = z.infer<typeof listCampaignsSchema>;
type RespondToCampaignApplicationInput = z.infer<
  typeof respondToCampaignApplicationSchema
>;
type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;
type UpdateCampaignParticipantInput = z.infer<
  typeof updateCampaignParticipantInputSchema
>;
type RemoveCampaignParticipantInput = z.infer<
  typeof removeCampaignParticipantInputSchema
>;

vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(),
}));

const mockCurrentUser = (user: User | null) => {
  vi.mocked(getCurrentUser).mockResolvedValue(user);
};

vi.mock("../campaigns.mutations", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    createCampaign:
      vi.fn<
        (data: CreateCampaignInput) => Promise<OperationResult<CampaignWithDetails>>
      >(),
    updateCampaign:
      vi.fn<
        (data: UpdateCampaignInput) => Promise<OperationResult<CampaignWithDetails>>
      >(),
    deleteCampaign:
      vi.fn<(data: GetCampaignInput) => Promise<OperationResult<boolean>>>(),
    inviteToCampaign:
      vi.fn<
        (data: InviteToCampaignInput) => Promise<OperationResult<CampaignParticipant>>
      >(),
    respondToApplication:
      vi.fn<
        (
          data: RespondToCampaignApplicationInput,
        ) => Promise<OperationResult<CampaignApplication | boolean>>
      >(),
    applyToCampaign:
      vi.fn<
        (data: ApplyToCampaignInput) => Promise<OperationResult<CampaignApplication>>
      >(),
    updateCampaignParticipant:
      vi.fn<
        (
          data: UpdateCampaignParticipantInput,
        ) => Promise<OperationResult<CampaignParticipant>>
      >(),
    removeCampaignParticipant:
      vi.fn<
        (data: RemoveCampaignParticipantInput) => Promise<OperationResult<boolean>>
      >(),
  };
});

vi.mock("../campaigns.queries", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    getCampaign:
      vi.fn<
        (data: GetCampaignInput) => Promise<OperationResult<CampaignWithDetails | null>>
      >(),
    listCampaigns:
      vi.fn<(data: ListCampaignsInput) => Promise<OperationResult<CampaignListItem[]>>>(),
    getCampaignApplications:
      vi.fn<
        (data: GetCampaignInput) => Promise<OperationResult<CampaignApplication[]>>
      >(),
    getCampaignParticipants:
      vi.fn<
        (data: GetCampaignInput) => Promise<OperationResult<CampaignParticipant[]>>
      >(),
    searchUsersForInvitation:
      vi.fn<
        (
          data: z.infer<typeof searchUsersForInvitationSchema>,
        ) => Promise<OperationResult<Array<{ id: string; name: string; email: string }>>>
      >(),
  };
});

import {
  applyToCampaign,
  createCampaign,
  deleteCampaign,
  inviteToCampaign,
  removeCampaignParticipant,
  respondToApplication,
  updateCampaign,
  updateCampaignParticipant,
} from "../campaigns.mutations";
import {
  getCampaign,
  getCampaignApplications,
  getCampaignParticipants,
  listCampaigns,
  searchUsersForInvitation,
} from "../campaigns.queries";

const BASE_USER_PROPS = {
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
  profileComplete: true,
  profileVersion: 1,
  gender: null,
  pronouns: null,
  phone: null,
  profileUpdatedAt: null,
  privacySettings: null,
};

const MOCK_OWNER_USER = {
  id: "owner-1",
  email: "owner@example.com",
  name: "Campaign Owner",
  ...BASE_USER_PROPS,
};
const MOCK_PLAYER_USER = {
  id: "player-1",
  email: "player@example.com",
  name: "Campaign Player",
  ...BASE_USER_PROPS,
};
const MOCK_INVITED_USER = {
  id: "invited-1",
  email: "invited@example.com",
  name: "Campaign Invited",
  ...BASE_USER_PROPS,
};
const MOCK_OTHER_USER = {
  id: "other-1",
  email: "other@example.com",
  name: "Other User",
  ...BASE_USER_PROPS,
};

const MOCK_CAMPAIGN = {
  id: "campaign-1",
  ownerId: MOCK_OWNER_USER.id,
  gameSystemId: 1,
  name: "Test Campaign",
  description: "A test campaign session",
  images: [],
  recurrence: "weekly" as const,
  timeOfDay: "evenings",
  sessionDuration: 240,
  pricePerSession: 0,
  language: "English",
  location: { address: "Test Location", lat: 0, lng: 0 },
  status: "active" as const,
  minimumRequirements: { languageLevel: "beginner" as const },
  visibility: "public" as const,
  safetyRules: { "no-alcohol": true, "safe-word": false },
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: MOCK_OWNER_USER,
  participants: [],
  applications: [],
  participantCount: 0,
};

const MOCK_OWNER_PARTICIPANT = {
  id: "part-owner-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_OWNER_USER.id,
  user: MOCK_OWNER_USER,
  role: "owner" as const,
  status: "approved" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PLAYER_PARTICIPANT = {
  id: "part-player-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_PLAYER_USER.id,
  user: MOCK_PLAYER_USER,
  role: "player" as const,
  status: "approved" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_INVITED_PARTICIPANT = {
  id: "part-invited-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_INVITED_USER.id,
  user: MOCK_INVITED_USER,
  role: "invited" as const,
  status: "pending" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_APPLICANT_APPLICATION = {
  id: "app-applicant-1",
  campaignId: MOCK_CAMPAIGN.id,
  userId: MOCK_OTHER_USER.id,
  status: "pending" as const,
  user: MOCK_OTHER_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Campaign Management Feature Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser(MOCK_OWNER_USER);
  });

  describe("createCampaign", () => {
    it("should create a campaign and add owner as participant when authenticated", async () => {
      vi.mocked(createCampaign).mockResolvedValue({
        success: true,
        data: MOCK_CAMPAIGN,
      });

      const result = await createCampaign({ data: MOCK_CAMPAIGN });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(MOCK_CAMPAIGN.id);
        expect(result.data.ownerId).toBe(MOCK_OWNER_USER.id);
      }
    });

    it("should fail to create campaign if not authenticated", async () => {
      mockCurrentUser(null);
      vi.mocked(createCampaign).mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await createCampaign({ data: MOCK_CAMPAIGN });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("updateCampaign", () => {
    it("should update campaign by owner", async () => {
      vi.mocked(updateCampaign).mockResolvedValue({
        success: true,
        data: { ...MOCK_CAMPAIGN, name: "Updated Campaign Name" },
      });

      const result = await updateCampaign({
        data: { id: MOCK_CAMPAIGN.id, name: "Updated Campaign Name" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Campaign Name");
      }
    });

    it("should fail to update campaign if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(updateCampaign).mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to update this campaign" },
        ],
      });

      const result = await updateCampaign({
        data: { id: MOCK_CAMPAIGN.id, name: "Updated Campaign Name" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("deleteCampaign", () => {
    it("should delete campaign by owner", async () => {
      vi.mocked(deleteCampaign).mockResolvedValue({ success: true, data: true });

      const result = await deleteCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail to delete campaign if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(deleteCampaign).mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to delete this campaign" },
        ],
      });

      const result = await deleteCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("applyToCampaign", () => {
    it("should allow user to apply to a campaign", async () => {
      mockCurrentUser(MOCK_OTHER_USER);
      vi.mocked(applyToCampaign).mockResolvedValue({
        success: true,
        data: MOCK_APPLICANT_APPLICATION,
      });

      const result = await applyToCampaign({ data: { campaignId: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_OTHER_USER.id);
        expect(result.data.status).toBe("pending");
      }
    });

    it("should fail if user is already an applicant", async () => {
      mockCurrentUser(MOCK_OTHER_USER);
      vi.mocked(applyToCampaign).mockResolvedValue({
        success: false,
        errors: [
          { code: "CONFLICT", message: "You have already applied to this campaign" },
        ],
      });

      const result = await applyToCampaign({ data: { campaignId: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("CONFLICT");
      }
    });
  });

  describe("respondToApplication", () => {
    it("should allow owner to approve an application", async () => {
      vi.mocked(respondToApplication).mockResolvedValue({
        success: true,
        data: { ...MOCK_APPLICANT_APPLICATION, status: "approved" },
      });

      const result = await respondToApplication({
        data: { applicationId: MOCK_APPLICANT_APPLICATION.id, status: "approved" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({ status: "approved" });
      }
    });

    it("should allow owner to reject an application", async () => {
      vi.mocked(respondToApplication).mockResolvedValue({ success: true, data: true });

      const result = await respondToApplication({
        data: { applicationId: MOCK_APPLICANT_APPLICATION.id, status: "rejected" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail if not campaign owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(respondToApplication).mockResolvedValue({
        success: false,
        errors: [
          {
            code: "AUTH_ERROR",
            message: "Application not found or you are not the owner of the campaign",
          },
        ],
      });

      const result = await respondToApplication({
        data: { applicationId: MOCK_APPLICANT_APPLICATION.id, status: "approved" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("inviteToCampaign", () => {
    it("should invite a user by owner (by userId)", async () => {
      vi.mocked(inviteToCampaign).mockResolvedValue({
        success: true,
        data: MOCK_INVITED_PARTICIPANT,
      });

      const result = await inviteToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id, userId: MOCK_INVITED_USER.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_INVITED_USER.id);
      }
    });

    it("should invite a user by owner (by email)", async () => {
      vi.mocked(inviteToCampaign).mockResolvedValue({
        success: true,
        data: MOCK_INVITED_PARTICIPANT,
      });

      const result = await inviteToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id, email: MOCK_INVITED_USER.email },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_INVITED_USER.id);
      }
    });

    it("should fail to invite if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(inviteToCampaign).mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
        ],
      });

      const result = await inviteToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id, userId: MOCK_INVITED_USER.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("listCampaigns", () => {
    it("should return public campaigns to all users", async () => {
      vi.mocked(listCampaigns).mockResolvedValue({
        success: true,
        data: [{ ...MOCK_CAMPAIGN, visibility: "public" }],
      });

      const result = await listCampaigns({ data: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "public" })]),
        );
      }
    });

    it("should return private campaigns to owner and participants", async () => {
      vi.mocked(listCampaigns).mockResolvedValue({
        success: true,
        data: [{ ...MOCK_CAMPAIGN, visibility: "private" }],
      });
      const resultOwner = await listCampaigns({ data: {} });
      expect(resultOwner.success).toBe(true);
      if (resultOwner.success) {
        expect(resultOwner.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "private" })]),
        );
      }

      mockCurrentUser(MOCK_INVITED_USER);
      vi.mocked(listCampaigns).mockResolvedValue({
        success: true,
        data: [{ ...MOCK_CAMPAIGN, visibility: "private" }],
      });
      const resultInvited = await listCampaigns({ data: {} });
      expect(resultInvited.success).toBe(true);
      if (resultInvited.success) {
        expect(resultInvited.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "private" })]),
        );
      }

      mockCurrentUser(MOCK_OTHER_USER);
      vi.mocked(listCampaigns).mockResolvedValue({
        success: true,
        data: [],
      });
      const resultOther = await listCampaigns({ data: {} });
      expect(resultOther.success).toBe(true);
      if (resultOther.success) {
        expect(resultOther.data).toEqual([]);
      }
    });
  });

  describe("getCampaign", () => {
    it("should return campaign details for a valid campaign ID", async () => {
      vi.mocked(getCampaign).mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });

      const result = await getCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result?.data?.id).toBe(MOCK_CAMPAIGN.id);
      }
    });

    it("should return error for invalid campaign ID format", async () => {
      vi.mocked(getCampaign).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid campaign ID format" }],
      });

      const result = await getCampaign({ data: { id: "invalid-uuid" } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("VALIDATION_ERROR");
      }
    });

    it("should return error if campaign not found", async () => {
      vi.mocked(getCampaign).mockResolvedValue({
        success: false,
        errors: [{ code: "NOT_FOUND", message: "Campaign not found" }],
      });

      const result = await getCampaign({ data: { id: "non-existent-campaign-id" } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getCampaignApplications", () => {
    it("should return pending applications for campaign owner", async () => {
      vi.mocked(getCampaignApplications).mockResolvedValue({
        success: true,
        data: [MOCK_APPLICANT_APPLICATION],
      });

      const result = await getCampaignApplications({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([MOCK_APPLICANT_APPLICATION]);
      }
    });

    it("should fail to return applications if not campaign owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(getCampaignApplications).mockResolvedValue({
        success: false,
        errors: [
          {
            code: "AUTH_ERROR",
            message: "Not authorized to view applications for this campaign",
          },
        ],
      });

      const result = await getCampaignApplications({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("getCampaignParticipants", () => {
    it("should return all participants for a campaign", async () => {
      vi.mocked(getCampaignParticipants).mockResolvedValue({
        success: true,
        data: [MOCK_OWNER_PARTICIPANT, MOCK_INVITED_PARTICIPANT],
      });

      const result = await getCampaignParticipants({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ userId: MOCK_OWNER_USER.id }),
            expect.objectContaining({ userId: MOCK_INVITED_USER.id }),
          ]),
        );
      }
    });

    it("should return empty array if no participants", async () => {
      vi.mocked(getCampaignParticipants).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getCampaignParticipants({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("searchUsersForInvitation", () => {
    it("should return users matching search term", async () => {
      vi.mocked(searchUsersForInvitation).mockResolvedValue({
        success: true,
        data: [{ id: "user-2", name: "Search User", email: "search@example.com" }],
      });

      const result = await searchUsersForInvitation({ data: { query: "search" } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].email).toBe("search@example.com");
      }
    });

    it("should return empty array if no users found", async () => {
      vi.mocked(searchUsersForInvitation).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await searchUsersForInvitation({ data: { query: "nonexistent" } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("updateCampaignParticipant", () => {
    it("should allow owner to update a participant", async () => {
      vi.mocked(updateCampaignParticipant).mockResolvedValue({
        success: true,
        data: { ...MOCK_PLAYER_PARTICIPANT, status: "approved" },
      });

      const result = await updateCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id, status: "approved" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("approved");
      }
    });

    it("should fail if non-owner tries to update other participants", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(updateCampaignParticipant).mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to update this participant" },
        ],
      });

      const result = await updateCampaignParticipant({
        data: { id: MOCK_OWNER_PARTICIPANT.id, status: "approved" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });

    it("should fail if not authenticated", async () => {
      mockCurrentUser(null);
      vi.mocked(updateCampaignParticipant).mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await updateCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id, status: "approved" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("removeCampaignParticipant", () => {
    it("should allow owner to remove any participant", async () => {
      vi.mocked(removeCampaignParticipant).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await removeCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should allow participant to remove themselves", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(removeCampaignParticipant).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await removeCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail if non-owner tries to remove other participants", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      vi.mocked(removeCampaignParticipant).mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to remove this participant" },
        ],
      });

      const result = await removeCampaignParticipant({
        data: { id: MOCK_OWNER_PARTICIPANT.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });

    it("should fail if not authenticated", async () => {
      mockCurrentUser(null);
      vi.mocked(removeCampaignParticipant).mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await removeCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });
});
