import { createServerFn } from "@tanstack/react-start";
import { addMinutes, formatISO } from "date-fns";

import type { OperationResult } from "~/shared/types/common";
import { updateGmPipelineNoteSchema } from "./gm.schemas";
import type {
  GmPipelineNoteUpdateResult,
  GmPipelineOpportunity,
  GmPipelineSnapshot,
  GmPipelineStage,
} from "./gm.types";
import { GmPipelineNote } from "./gm.types";

const STORY_GUIDE_USER = {
  id: "gm-alex",
  name: "Alex Morgan",
  role: "story_guide" as const,
};

const GM_PIPELINE_STAGES: GmPipelineStage[] = [
  {
    id: "discovery",
    label: "Discovery",
    description: "Initial alignment on goals, tone, and logistics.",
    serviceLevelMinutes: 48 * 60,
    exitCriteria: [
      "Stakeholder intake call completed",
      "Story goals documented",
      "Prospect shared decision timeline",
    ],
  },
  {
    id: "scoping",
    label: "Scoping",
    description: "Craft bespoke proposal, pricing, and pilot outline.",
    serviceLevelMinutes: 72 * 60,
    exitCriteria: [
      "Proposal draft delivered",
      "Safety enablement plan reviewed",
      "Production resourcing confirmed",
    ],
  },
  {
    id: "enablement",
    label: "Enablement",
    description: "Lock logistics, facilitators, and safety rituals.",
    serviceLevelMinutes: 36 * 60,
    exitCriteria: [
      "Contract signed",
      "Facilitator roster staffed",
      "Safety and escalation hooks rehearsed",
    ],
  },
  {
    id: "launch",
    label: "Launch",
    description: "Deliver activations with live health monitoring.",
    serviceLevelMinutes: 12 * 60,
    exitCriteria: [
      "Kickoff briefing completed",
      "Live playbook distributed",
      "Escalation bridge stood up",
    ],
  },
  {
    id: "retention",
    label: "Retention",
    description: "Debrief, measure impact, and plan renewals.",
    serviceLevelMinutes: 96 * 60,
    exitCriteria: [
      "Impact debrief scheduled",
      "Renewal appetite scored",
      "Success story cues captured",
    ],
  },
];

const pipelineStore = new Map<string, GmPipelineOpportunity>();

function seedPipelineStore() {
  if (pipelineStore.size > 0) {
    return;
  }

  const now = new Date("2024-03-12T16:00:00.000Z");

  const opportunities: GmPipelineOpportunity[] = [
    {
      id: "opp-skybound",
      organization: "Skybound Esports League",
      location: "Seattle, WA",
      pointOfContact: "Morgan Ellis",
      contactTitle: "Events Partnerships",
      contactEmail: "morgan.ellis@skybound.gg",
      stageId: "discovery",
      stageEnteredAt: "2024-03-08T17:30:00.000Z",
      potentialValue: 18000,
      engagementModel: "Seasonal league narrative program",
      nextStep: "Send cinematic moodboard samples for pilot season",
      followUpDueAt: "2024-03-14T19:00:00.000Z",
      lastInteractionAt: "2024-03-11T21:15:00.000Z",
      health: "attention",
      assignments: [
        {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
          avatarColor: "bg-indigo-500",
        },
        {
          id: "ops-nadia",
          name: "Nadia Chen",
          role: "ops",
          email: "nadia@solsticehq.com",
          avatarColor: "bg-amber-500",
        },
      ],
      escalationHooks: [
        {
          id: "esc-skybound-contract",
          title: "Contract redlines",
          status: "monitoring",
          severity: "warning",
          description:
            "Legal feedback due Thursday. Platform admin will review for compliance flags.",
          escalateToRole: "platform_admin",
          triggeredAt: "2024-03-11T23:10:00.000Z",
          requiresResponseBy: "2024-03-14T17:00:00.000Z",
        },
      ],
      services: ["Narrative direction", "Facilitator staffing", "Safety workshop"],
      linkedCampaignName: "Legends of Eyris: Corporate League",
      note: {
        id: "note-skybound",
        content:
          "Morgan loved the idea of spotlighting player backstories between matches. Waiting on sample scenes before looping finance.",
        updatedAt: "2024-03-11T23:15:00.000Z",
        updatedBy: {
          id: "ops-nadia",
          name: "Nadia Chen",
          role: "ops",
        },
      },
    },
    {
      id: "opp-luminary",
      organization: "Luminary Labs",
      location: "Remote",
      pointOfContact: "Felix Ramos",
      contactTitle: "Chief Experience Officer",
      contactEmail: "felix@luminarylabs.com",
      stageId: "scoping",
      stageEnteredAt: "2024-03-05T15:45:00.000Z",
      potentialValue: 42000,
      engagementModel: "Quarterly leadership storytelling sprints",
      nextStep: "Finalize cost structure with volume-based pricing",
      followUpDueAt: "2024-03-13T18:00:00.000Z",
      lastInteractionAt: "2024-03-12T13:20:00.000Z",
      health: "on_track",
      assignments: [
        {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
          avatarColor: "bg-indigo-500",
        },
        {
          id: "ops-isaac",
          name: "Isaac Monroe",
          role: "ops",
          email: "isaac@solsticehq.com",
          avatarColor: "bg-emerald-500",
        },
        {
          id: "pa-jordan",
          name: "Jordan Blake",
          role: "platform_admin",
          email: "jordan@solsticehq.com",
          avatarColor: "bg-slate-500",
        },
      ],
      escalationHooks: [
        {
          id: "esc-luminary-safety",
          title: "Safety enablement",
          status: "idle",
          severity: "info",
          description:
            "Schedule consent workshop once proposal is approved. Platform admin on standby for compliance.",
          escalateToRole: "platform_admin",
          triggeredAt: null,
          requiresResponseBy: null,
        },
      ],
      services: ["Story coaching", "Bespoke worldbuilding", "Impact analytics"],
      linkedCampaignName: null,
      note: {
        id: "note-luminary",
        content:
          "Felix asked for a metrics snapshot to convince procurement. Drafting narrative impact matrix with case studies.",
        updatedAt: "2024-03-12T13:25:00.000Z",
        updatedBy: {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
        },
      },
    },
    {
      id: "opp-ember-collective",
      organization: "Ember Collective",
      location: "Austin, TX",
      pointOfContact: "Priya Sharma",
      contactTitle: "Program Director",
      contactEmail: "priya@embercollective.org",
      stageId: "enablement",
      stageEnteredAt: "2024-02-27T19:30:00.000Z",
      potentialValue: 12500,
      engagementModel: "Hybrid community storytelling retreat",
      nextStep: "Confirm facilitator travel and wellness accommodations",
      followUpDueAt: "2024-03-13T15:00:00.000Z",
      lastInteractionAt: "2024-03-10T22:40:00.000Z",
      health: "attention",
      assignments: [
        {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
          avatarColor: "bg-indigo-500",
        },
        {
          id: "ops-amara",
          name: "Amara Holt",
          role: "ops",
          email: "amara@solsticehq.com",
          avatarColor: "bg-rose-500",
        },
      ],
      escalationHooks: [
        {
          id: "esc-ember-safety",
          title: "Safety plan review",
          status: "triggered",
          severity: "critical",
          description:
            "Client requested expedited trauma-informed review due to executive participation.",
          escalateToRole: "platform_admin",
          triggeredAt: "2024-03-10T20:15:00.000Z",
          requiresResponseBy: formatISO(addMinutes(now, 180)),
        },
      ],
      services: ["Retreat facilitation", "Cinematic recap", "Safety concierge"],
      linkedCampaignName: "Ember Stories: Spring Cohort",
      note: {
        id: "note-ember",
        content:
          "Priya needs assurance on facilitator coverage for day two. Drafting alternate staffing plan with Amara.",
        updatedAt: "2024-03-10T22:45:00.000Z",
        updatedBy: {
          id: "ops-amara",
          name: "Amara Holt",
          role: "ops",
        },
      },
    },
    {
      id: "opp-horizon-biotech",
      organization: "Horizon Biotech",
      location: "Boston, MA",
      pointOfContact: "Camille Brooks",
      contactTitle: "Chief of Staff",
      contactEmail: "camille@horizonbio.com",
      stageId: "launch",
      stageEnteredAt: "2024-03-02T18:05:00.000Z",
      potentialValue: 28500,
      engagementModel: "Immersive product storytelling lab",
      nextStep: "Host run-of-show rehearsal with internal comms team",
      followUpDueAt: "2024-03-12T20:30:00.000Z",
      lastInteractionAt: "2024-03-12T15:00:00.000Z",
      health: "on_track",
      assignments: [
        {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
          avatarColor: "bg-indigo-500",
        },
        {
          id: "ops-nadia",
          name: "Nadia Chen",
          role: "ops",
          avatarColor: "bg-amber-500",
        },
        {
          id: "pa-jordan",
          name: "Jordan Blake",
          role: "platform_admin",
          avatarColor: "bg-slate-500",
        },
      ],
      escalationHooks: [
        {
          id: "esc-horizon-legal",
          title: "Escalation bridge",
          status: "monitoring",
          severity: "warning",
          description:
            "Platform admin requested to stay on bridge during rehearsal due to regulated storytelling elements.",
          escalateToRole: "platform_admin",
          triggeredAt: "2024-03-11T18:00:00.000Z",
          requiresResponseBy: "2024-03-12T21:00:00.000Z",
        },
      ],
      services: ["Narrative design", "Facilitator training", "Regulated content QA"],
      linkedCampaignName: null,
      note: {
        id: "note-horizon",
        content:
          "Camille confirmed lab participants. Need to script the compliance-friendly cold open before rehearsal.",
        updatedAt: "2024-03-12T15:05:00.000Z",
        updatedBy: STORY_GUIDE_USER,
      },
    },
    {
      id: "opp-northwind",
      organization: "Northwind Financial",
      location: "Chicago, IL",
      pointOfContact: "Evelyn Hart",
      contactTitle: "SVP, Culture & People",
      contactEmail: "evelyn.hart@northwind.com",
      stageId: "retention",
      stageEnteredAt: "2024-02-20T21:20:00.000Z",
      potentialValue: 36000,
      engagementModel: "Executive storytelling residency",
      nextStep: "Prepare renewal deck with impact storytelling clips",
      followUpDueAt: "2024-03-18T17:00:00.000Z",
      lastInteractionAt: "2024-03-09T16:55:00.000Z",
      health: "at_risk",
      assignments: [
        {
          id: STORY_GUIDE_USER.id,
          name: STORY_GUIDE_USER.name,
          role: STORY_GUIDE_USER.role,
          avatarColor: "bg-indigo-500",
        },
        {
          id: "ops-isaac",
          name: "Isaac Monroe",
          role: "ops",
          avatarColor: "bg-emerald-500",
        },
        {
          id: "pa-anelise",
          name: "Anelise Grant",
          role: "platform_admin",
          avatarColor: "bg-blue-500",
        },
      ],
      escalationHooks: [
        {
          id: "esc-northwind-renewal",
          title: "Renewal risk",
          status: "triggered",
          severity: "critical",
          description:
            "Finance flagged budget pressure; platform admin requested retention playbook and executive sponsor outreach.",
          escalateToRole: "platform_admin",
          triggeredAt: "2024-03-09T17:10:00.000Z",
          requiresResponseBy: "2024-03-15T16:00:00.000Z",
        },
      ],
      services: ["Executive coaching", "Immersive sessions", "Impact analytics"],
      linkedCampaignName: "Northwind Legends",
      note: {
        id: "note-northwind",
        content:
          "Need updated ROI visuals before finance reviews renewal. Capture quotes from latest residency cohort.",
        updatedAt: "2024-03-09T18:00:00.000Z",
        updatedBy: {
          id: "pa-anelise",
          name: "Anelise Grant",
          role: "platform_admin",
        },
      },
    },
  ];

  opportunities.forEach((opportunity) => {
    pipelineStore.set(opportunity.id, opportunity);
  });
}

function getSnapshot(): GmPipelineSnapshot {
  return {
    stages: GM_PIPELINE_STAGES,
    opportunities: Array.from(pipelineStore.values()),
    updatedAt: new Date().toISOString(),
  };
}

export const listGmB2bPipeline = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<GmPipelineSnapshot>> => {
    seedPipelineStore();
    return {
      success: true,
      data: getSnapshot(),
    };
  },
);

export const updateGmPipelineNote = createServerFn({ method: "POST" })
  .validator(updateGmPipelineNoteSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GmPipelineNoteUpdateResult>> => {
    seedPipelineStore();
    const existing = pipelineStore.get(data.opportunityId);

    if (!existing) {
      return {
        success: false,
        errors: [{ code: "NOT_FOUND", message: "Opportunity not found" }],
      };
    }

    const currentNote = existing.note;
    if (currentNote && data.lastSyncedAt && currentNote.updatedAt !== data.lastSyncedAt) {
      return {
        success: true,
        data: {
          opportunityId: existing.id,
          outcome: "conflict",
          note: currentNote,
        },
      };
    }

    const trimmedContent = data.content.trim();
    const updatedNote: GmPipelineNote = {
      id: currentNote?.id ?? data.noteId,
      content: trimmedContent,
      updatedAt: new Date().toISOString(),
      updatedBy: STORY_GUIDE_USER,
    };

    pipelineStore.set(existing.id, {
      ...existing,
      note: updatedNote,
    });

    return {
      success: true,
      data: {
        opportunityId: existing.id,
        outcome: "updated",
        note: updatedNote,
      },
    };
  });
