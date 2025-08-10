import { z } from "zod";
import type { user } from "~/db/schema";
import type {
  campaignApplications,
  campaignRecurrenceEnum,
  campaigns,
  campaignStatusEnum,
} from "~/db/schema/campaigns.schema"; // Removed campaignApplicationStatusEnum
import type { applicationStatusEnum, visibilityEnum } from "~/db/schema/shared.schema"; // Added applicationStatusEnum
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

export type Campaign = typeof campaigns.$inferSelect & {
  location: z.infer<typeof locationSchema>;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema>;
  safetyRules: z.infer<typeof safetyRulesSchema>;
};
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number];
export type CampaignVisibility = (typeof visibilityEnum.enumValues)[number]; // Changed to visibilityEnum
export type CampaignRecurrence = (typeof campaignRecurrenceEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type CampaignParticipantRole = ParticipantRole;
export type CampaignParticipantStatus = ParticipantStatus;

export type CampaignWithDetails = Campaign & {
  owner: typeof user.$inferSelect | null;
  participants: CampaignParticipant[];
  applications: CampaignApplication[];
  participantCount?: number;
};

export type CampaignParticipant = BaseParticipantWithUser & {
  campaignId: string;
};

export type CampaignApplication = typeof campaignApplications.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type CampaignListItem = Campaign & {
  owner: { id: string; name: string | null; email: string } | null;
  participantCount: number;
};
