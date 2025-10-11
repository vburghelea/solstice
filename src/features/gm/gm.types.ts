import type { z } from "zod";

import type {
  gmPipelineNoteUpdateOutcomeSchema,
  gmPipelineRoleSchema,
  gmPipelineStageIdSchema,
} from "./gm.schemas";

export type GmPipelineRole = z.infer<typeof gmPipelineRoleSchema>;
export type GmPipelineStageId = z.infer<typeof gmPipelineStageIdSchema>;
export type GmPipelineNoteUpdateOutcome = z.infer<
  typeof gmPipelineNoteUpdateOutcomeSchema
>;

export interface GmPipelineStage {
  id: GmPipelineStageId;
  label: string;
  description: string;
  serviceLevelMinutes: number;
  exitCriteria: string[];
}

export interface GmPipelineAssignment {
  id: string;
  name: string;
  role: GmPipelineRole;
  email?: string;
  avatarColor?: string;
}

export interface GmPipelineEscalationHook {
  id: string;
  title: string;
  status: "idle" | "monitoring" | "triggered";
  severity: "info" | "warning" | "critical";
  description: string;
  escalateToRole: Exclude<GmPipelineRole, "story_guide">;
  triggeredAt: string | null;
  requiresResponseBy: string | null;
}

export type GmPipelineHealth = "on_track" | "attention" | "at_risk";

export interface GmPipelineNoteAuthor {
  id: string;
  name: string;
  role: GmPipelineRole;
}

export interface GmPipelineNote {
  id: string;
  content: string;
  updatedAt: string;
  updatedBy: GmPipelineNoteAuthor;
}

export interface GmPipelineOpportunity {
  id: string;
  organization: string;
  location: string | null;
  pointOfContact: string;
  contactTitle: string | null;
  contactEmail: string | null;
  stageId: GmPipelineStageId;
  stageEnteredAt: string;
  potentialValue: number;
  engagementModel: string;
  nextStep: string;
  followUpDueAt: string;
  lastInteractionAt: string;
  health: GmPipelineHealth;
  assignments: GmPipelineAssignment[];
  escalationHooks: GmPipelineEscalationHook[];
  services: string[];
  linkedCampaignName: string | null;
  note: GmPipelineNote;
}

export interface GmPipelineSnapshot {
  stages: GmPipelineStage[];
  opportunities: GmPipelineOpportunity[];
  updatedAt: string;
}

export interface GmPipelineNoteUpdateResult {
  opportunityId: string;
  outcome: GmPipelineNoteUpdateOutcome;
  note: GmPipelineNote;
}
