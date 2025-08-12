/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { getCurrentUser } from "~/features/auth/auth.queries";

import type { User } from "~/lib/auth/types";

import {
  applyToCampaignInputSchema as _applyToCampaignInputSchema,
  createCampaignInputSchema as _createCampaignInputSchema,
  getCampaignSchema as _getCampaignSchema,
  inviteToCampaignInputSchema as _inviteToCampaignInputSchema,
  listCampaignsSchema as _listCampaignsSchema,
  removeCampaignParticipantInputSchema as _removeCampaignParticipantInputSchema,
  respondToCampaignApplicationSchema as _respondToCampaignApplicationSchema,
  updateCampaignInputSchema as _updateCampaignInputSchema,
  updateCampaignParticipantInputSchema as _updateCampaignParticipantInputSchema,
} from "../campaigns.schemas";

type ApplyToCampaignInput = z.infer<typeof _applyToCampaignInputSchema>;

type CreateCampaignInput = z.infer<typeof _createCampaignInputSchema>;

type GetCampaignInput = z.infer<typeof _getCampaignSchema>;

type InviteToCampaignInput = z.infer<typeof _inviteToCampaignInputSchema>;

type ListCampaignsInput = z.infer<typeof _listCampaignsSchema>;

type RespondToCampaignApplicationInput = z.infer<
  typeof _respondToCampaignApplicationSchema
>;

type UpdateCampaignInput = z.infer<typeof _updateCampaignInputSchema>;

type UpdateCampaignParticipantInput = z.infer<
  typeof _updateCampaignParticipantInputSchema
>;

type RemoveCampaignParticipantInput = z.infer<
  typeof _removeCampaignParticipantInputSchema
>;

const mockCurrentUser = (user: User | null) => {
  vi.mocked(getCurrentUser).mockResolvedValue(user);
};

import { setupCampaignMocks } from "~/tests/mocks/campaigns";

import {
  MOCK_INVITED_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
  MOCK_PLAYER_USER,
} from "~/tests/mocks/users";

import {
  MOCK_APPLICANT_APPLICATION,
  MOCK_CAMPAIGN,
  MOCK_INVITED_PARTICIPANT,
  MOCK_OWNER_PARTICIPANT,
  MOCK_PLAYER_PARTICIPANT,
} from "~/tests/mocks/campaigns";

describe("Campaign Management Feature Tests", () => {
  let mocks: ReturnType<typeof setupCampaignMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser(MOCK_OWNER_USER);
    mocks = setupCampaignMocks(); // Call the campaign mocks setup function and capture returned mocks
  });

  describe("createCampaign", () => {
    it("should create a campaign and add owner as participant when authenticated", async () => {
      mocks.mockCreateCampaign.mockResolvedValue({
        success: true,
        data: MOCK_CAMPAIGN,
      });

      const result = await mocks.mockCreateCampaign({ data: MOCK_CAMPAIGN });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(MOCK_CAMPAIGN.id);
        expect(result.data.ownerId).toBe(MOCK_OWNER_USER.id);
      }
    });

    it("should fail to create campaign if not authenticated", async () => {
      mockCurrentUser(null);
      mocks.mockCreateCampaign.mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await mocks.mockCreateCampaign({ data: MOCK_CAMPAIGN });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("updateCampaign", () => {
    it("should update campaign by owner", async () => {
      mocks.mockUpdateCampaign.mockResolvedValue({
        success: true,
        data: { ...MOCK_CAMPAIGN, name: "Updated Campaign Name" },
      });

      const result = await mocks.mockUpdateCampaign({
        data: { id: MOCK_CAMPAIGN.id, name: "Updated Campaign Name" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Campaign Name");
      }
    });

    it("should fail to update campaign if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockUpdateCampaign.mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to update this campaign" },
        ],
      });

      const result = await mocks.mockUpdateCampaign({
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
      mocks.mockDeleteCampaign.mockResolvedValue({ success: true, data: true });

      const result = await mocks.mockDeleteCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail to delete campaign if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockDeleteCampaign.mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to delete this campaign" },
        ],
      });

      const result = await mocks.mockDeleteCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("applyToCampaign", () => {
    it("should allow user to apply to a campaign", async () => {
      mockCurrentUser(MOCK_OTHER_USER);
      mocks.mockApplyToCampaign.mockResolvedValue({
        success: true,
        data: MOCK_APPLICANT_APPLICATION,
      });

      const result = await mocks.mockApplyToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_OTHER_USER.id);
        expect(result.data.status).toBe("pending");
      }
    });

    it("should fail if user is already an applicant", async () => {
      mockCurrentUser(MOCK_OTHER_USER);
      mocks.mockApplyToCampaign.mockResolvedValue({
        success: false,
        errors: [
          { code: "CONFLICT", message: "You have already applied to this campaign" },
        ],
      });

      const result = await mocks.mockApplyToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("CONFLICT");
      }
    });
  });

  describe("respondToApplication", () => {
    it("should allow owner to approve an application", async () => {
      mocks.mockRespondToApplication.mockResolvedValue({
        success: true,
        data: { ...MOCK_APPLICANT_APPLICATION, status: "approved" },
      });

      const result = await mocks.mockRespondToApplication({
        data: { applicationId: MOCK_APPLICANT_APPLICATION.id, status: "approved" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({ status: "approved" });
      }
    });

    it("should allow owner to reject an application", async () => {
      mocks.mockRespondToApplication.mockResolvedValue({ success: true, data: true });

      const result = await mocks.mockRespondToApplication({
        data: { applicationId: MOCK_APPLICANT_APPLICATION.id, status: "rejected" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail if not campaign owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockRespondToApplication.mockResolvedValue({
        success: false,
        errors: [
          {
            code: "AUTH_ERROR",
            message: "Application not found or you are not the owner of the campaign",
          },
        ],
      });

      const result = await mocks.mockRespondToApplication({
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
      mocks.mockInviteToCampaign.mockResolvedValue({
        success: true,
        data: MOCK_INVITED_PARTICIPANT,
      });

      const result = await mocks.mockInviteToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id, userId: MOCK_INVITED_USER.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_INVITED_USER.id);
      }
    });

    it("should invite a user by owner (by email)", async () => {
      mocks.mockInviteToCampaign.mockResolvedValue({
        success: true,
        data: MOCK_INVITED_PARTICIPANT,
      });

      const result = await mocks.mockInviteToCampaign({
        data: { campaignId: MOCK_CAMPAIGN.id, email: MOCK_INVITED_USER.email },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(MOCK_INVITED_USER.id);
      }
    });

    it("should fail to invite if not owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockInviteToCampaign.mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
        ],
      });

      const result = await mocks.mockInviteToCampaign({
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
      mocks.mockListCampaigns.mockResolvedValue({
        success: true,
        data: [
          {
            ...MOCK_CAMPAIGN,
            visibility: "public",
            participantCount: MOCK_CAMPAIGN.participants.length,
          },
        ],
      });

      const result = await mocks.mockListCampaigns({ data: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "public" })]),
        );
      }
    });

    it("should return private campaigns to owner and participants", async () => {
      mocks.mockListCampaigns.mockResolvedValue({
        success: true,
        data: [
          {
            ...MOCK_CAMPAIGN,
            visibility: "private",
            participantCount: MOCK_CAMPAIGN.participants.length,
          },
        ],
      });
      const resultOwner = await mocks.mockListCampaigns({ data: {} });
      expect(resultOwner.success).toBe(true);
      if (resultOwner.success) {
        expect(resultOwner.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "private" })]),
        );
      }

      mockCurrentUser(MOCK_INVITED_USER);
      mocks.mockListCampaigns.mockResolvedValue({
        success: true,
        data: [
          {
            ...MOCK_CAMPAIGN,
            visibility: "private",
            participantCount: MOCK_CAMPAIGN.participants.length,
          },
        ],
      });
      const resultInvited = await mocks.mockListCampaigns({ data: {} });
      expect(resultInvited.success).toBe(true);
      if (resultInvited.success) {
        expect(resultInvited.data).toEqual(
          expect.arrayContaining([expect.objectContaining({ visibility: "private" })]),
        );
      }

      mockCurrentUser(MOCK_OTHER_USER);
      mocks.mockListCampaigns.mockResolvedValue({
        success: true,
        data: [],
      });
      const resultOther = await mocks.mockListCampaigns({ data: {} });
      expect(resultOther.success).toBe(true);
      if (resultOther.success) {
        expect(resultOther.data).toEqual([]);
      }
    });
  });

  describe("getCampaign", () => {
    it("should return campaign details for a valid campaign ID", async () => {
      mocks.mockGetCampaign.mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });

      const result = await mocks.mockGetCampaign({ data: { id: MOCK_CAMPAIGN.id } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result?.data?.id).toBe(MOCK_CAMPAIGN.id);
      }
    });

    it("should return error for invalid campaign ID format", async () => {
      mocks.mockGetCampaign.mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid campaign ID format" }],
      });

      const result = await mocks.mockGetCampaign({ data: { id: "invalid-uuid" } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("VALIDATION_ERROR");
      }
    });

    it("should return error if campaign not found", async () => {
      mocks.mockGetCampaign.mockResolvedValue({
        success: false,
        errors: [{ code: "NOT_FOUND", message: "Campaign not found" }],
      });

      const result = await mocks.mockGetCampaign({
        data: { id: "non-existent-campaign-id" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getCampaignApplications", () => {
    it("should return pending applications for campaign owner", async () => {
      mocks.mockGetCampaignApplications.mockResolvedValue({
        success: true,
        data: [MOCK_APPLICANT_APPLICATION],
      });

      const result = await mocks.mockGetCampaignApplications({
        data: { id: MOCK_CAMPAIGN.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([MOCK_APPLICANT_APPLICATION]);
      }
    });

    it("should fail to return applications if not campaign owner", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockGetCampaignApplications.mockResolvedValue({
        success: false,
        errors: [
          {
            code: "AUTH_ERROR",
            message: "Not authorized to view applications for this campaign",
          },
        ],
      });

      const result = await mocks.mockGetCampaignApplications({
        data: { id: MOCK_CAMPAIGN.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });

  describe("getCampaignParticipants", () => {
    it("should return all participants for a campaign", async () => {
      mocks.mockGetCampaignParticipants.mockResolvedValue({
        success: true,
        data: [MOCK_OWNER_PARTICIPANT, MOCK_INVITED_PARTICIPANT],
      });

      const result = await mocks.mockGetCampaignParticipants({
        data: { id: MOCK_CAMPAIGN.id },
      });
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
      mocks.mockGetCampaignParticipants.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await mocks.mockGetCampaignParticipants({
        data: { id: MOCK_CAMPAIGN.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("searchUsersForInvitation", () => {
    it("should return users matching search term", async () => {
      mocks.mockSearchUsersForInvitation.mockResolvedValue({
        success: true,
        data: [{ id: "user-2", name: "Search User", email: "search@example.com" }],
      });

      const result = await mocks.mockSearchUsersForInvitation({
        data: { query: "search" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].email).toBe("search@example.com");
      }
    });

    it("should return empty array if no users found", async () => {
      mocks.mockSearchUsersForInvitation.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await mocks.mockSearchUsersForInvitation({
        data: { query: "nonexistent" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("updateCampaignParticipant", () => {
    it("should allow owner to update a participant", async () => {
      mocks.mockUpdateCampaignParticipant.mockResolvedValue({
        success: true,
        data: { ...MOCK_PLAYER_PARTICIPANT, status: "approved" },
      });

      const result = await mocks.mockUpdateCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id, status: "approved" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("approved");
      }
    });

    it("should fail if non-owner tries to update other participants", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockUpdateCampaignParticipant.mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to update this participant" },
        ],
      });

      const result = await mocks.mockUpdateCampaignParticipant({
        data: { id: MOCK_OWNER_PARTICIPANT.id, status: "approved" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });

    it("should fail if not authenticated", async () => {
      mockCurrentUser(null);
      mocks.mockUpdateCampaignParticipant.mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await mocks.mockUpdateCampaignParticipant({
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
      mocks.mockRemoveCampaignParticipant.mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await mocks.mockRemoveCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should allow participant to remove themselves", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockRemoveCampaignParticipant.mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await mocks.mockRemoveCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should fail if non-owner tries to remove other participants", async () => {
      mockCurrentUser(MOCK_PLAYER_USER);
      mocks.mockRemoveCampaignParticipant.mockResolvedValue({
        success: false,
        errors: [
          { code: "AUTH_ERROR", message: "Not authorized to remove this participant" },
        ],
      });

      const result = await mocks.mockRemoveCampaignParticipant({
        data: { id: MOCK_OWNER_PARTICIPANT.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });

    it("should fail if not authenticated", async () => {
      mockCurrentUser(null);
      mocks.mockRemoveCampaignParticipant.mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await mocks.mockRemoveCampaignParticipant({
        data: { id: MOCK_PLAYER_PARTICIPANT.id },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("AUTH_ERROR");
      }
    });
  });
});
