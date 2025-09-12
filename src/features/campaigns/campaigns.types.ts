import { z } from "zod";
import type { GameSystem, user } from "~/db/schema";
import type {
  campaignApplications,
  campaignRecurrenceEnum,
  campaigns,
  campaignStatusEnum,
} from "~/db/schema/campaigns.schema";
import type { applicationStatusEnum, visibilityEnum } from "~/db/schema/shared.schema";
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
import {
  campaignExpectationsSchema,
  sessionZeroCharacterCreationSchema, // Import new schema
  sessionZeroSafetyToolsSchema, // Import new schema
  sessionZeroSchema,
  tableExpectationsSchema,
} from "./campaigns.schemas"; // Import new schemas

// Define types for the JSONB schemas
export type SessionZeroDataType = z.infer<typeof sessionZeroSchema>;
export type CampaignExpectationsType = z.infer<typeof campaignExpectationsSchema>;
export type TableExpectationsType = z.infer<typeof tableExpectationsSchema>;
export type SessionZeroSafetyToolsType = z.infer<typeof sessionZeroSafetyToolsSchema>;
export type SessionZeroCharacterCreationType = z.infer<
  typeof sessionZeroCharacterCreationSchema
>;

export type Campaign = typeof campaigns.$inferSelect & {
  location: z.infer<typeof locationSchema>;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema>;
  safetyRules: z.infer<typeof safetyRulesSchema>;
};
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number];
export type CampaignVisibility = (typeof visibilityEnum.enumValues)[number];
export type CampaignRecurrence = (typeof campaignRecurrenceEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type CampaignParticipantRole = ParticipantRole;
export type CampaignParticipantStatus = ParticipantStatus;

export type CampaignWithDetails = Campaign & {
  owner: typeof user.$inferSelect | null;
  gameSystem: GameSystem;
  participants: CampaignParticipant[];
  applications: CampaignApplication[];
  participantCount?: number;
  // New fields for Session Zero
  sessionZeroData?: SessionZeroDataType | null;
  campaignExpectations?: CampaignExpectationsType | null;
  tableExpectations?: TableExpectationsType | null;
  characterCreationOutcome?: string | null;
};

export type CampaignParticipant = BaseParticipantWithUser & {
  campaignId: string;
};

export type CampaignApplication = typeof campaignApplications.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type CampaignListItem = Campaign & {
  owner: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    uploadedAvatarPath?: string | null;
    gmRating?: number | null;
  } | null;
  participantCount: number;
  gameSystem: { id: number; name: string };
  // New fields for Session Zero
  sessionZeroData?: SessionZeroDataType | null;
  campaignExpectations?: CampaignExpectationsType | null;
  tableExpectations?: TableExpectationsType | null;
  characterCreationOutcome?: string | null;
};
