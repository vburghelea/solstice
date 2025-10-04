import type { PersonaId } from "~/features/inbox/types";

export type CrossNamespaceMetric = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "steady";
  description: string;
  personaBreakdown: Array<{
    persona: PersonaId;
    value: string;
    delta?: string;
  }>;
};

export type PersonaAlignmentSummary = {
  persona: PersonaId;
  focus: string;
  alignmentScore: number;
  confidence: "rising" | "steady" | "watch";
  keySignals: string[];
  openQuestions: string[];
};

export type CollaborationRhythm = {
  id: string;
  title: string;
  cadence: string;
  ownerPersona: PersonaId;
  nextSessionAt: string;
  status: "on-track" | "at-risk" | "needs-support";
  summary: string;
  linkedThreads: string[];
};

export type FeedbackLoopEntry = {
  id: string;
  persona: PersonaId;
  title: string;
  prompt: string;
  participationRate: string;
  sentiment: "positive" | "neutral" | "concerned";
  lastUpdatedAt: string;
  backlogStatus: "triaged" | "in-progress" | "shipped";
  insights: string[];
  quickReactions: Array<{
    id: string;
    label: string;
    emoji: string;
    count: number;
  }>;
};

export type CrossPersonaReportingSnapshot = {
  updatedAt: string;
  summary: string;
  metrics: CrossNamespaceMetric[];
  personaAlignment: PersonaAlignmentSummary[];
  collaborationRhythms: CollaborationRhythm[];
  feedbackLoops: FeedbackLoopEntry[];
};
