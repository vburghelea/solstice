import { z } from "zod";
import type { user } from "~/db/schema";
import type {
  campaignApplications,
  campaignApplicationStatusEnum,
  campaignParticipantRoleEnum,
  campaignParticipants,
  campaignParticipantStatusEnum,
  campaignRecurrenceEnum,
  campaigns,
  campaignStatusEnum,
  campaignVisibilityEnum,
} from "~/db/schema/campaigns.schema";
import {
  campaignLocationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "./campaigns.schemas";

export type Campaign = typeof campaigns.$inferSelect & {
  location: z.infer<typeof campaignLocationSchema>;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema>;
  safetyRules: z.infer<typeof safetyRulesSchema>;
};
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number];
export type CampaignVisibility = (typeof campaignVisibilityEnum.enumValues)[number];
export type CampaignRecurrence = (typeof campaignRecurrenceEnum.enumValues)[number];
export type CampaignApplicationStatus =
  (typeof campaignApplicationStatusEnum.enumValues)[number];
export type CampaignParticipantRole =
  (typeof campaignParticipantRoleEnum.enumValues)[number];
export type CampaignParticipantStatus =
  (typeof campaignParticipantStatusEnum.enumValues)[number];

export type CampaignWithDetails = Campaign & {
  owner: typeof user.$inferSelect | null;
  participants: CampaignParticipant[];
  applications: CampaignApplication[];
};

export type CampaignParticipant = typeof campaignParticipants.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type CampaignApplication = typeof campaignApplications.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type CampaignListItem = Campaign & {
  owner: { id: string; name: string | null; email: string } | null;
  participantCount: number;
};

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { code: string; message: string; field?: string }[] };
