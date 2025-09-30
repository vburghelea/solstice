import { formatISO } from "date-fns";

import type { CrossPersonaReportingSnapshot } from "~/features/collaboration/types";

const now = new Date("2025-03-18T17:30:00.000Z");

export const CROSS_PERSONA_REPORTING_SNAPSHOT: CrossPersonaReportingSnapshot = {
  updatedAt: formatISO(now),
  summary:
    "Collaborative health remains strong this week, with campaign readiness, event ops, and governance rituals sharing context-rich updates that keep decisions transparent across personas.",
  metrics: [
    {
      id: "conversion-bridge",
      label: "Visitor → Player conversion",
      value: "38%",
      delta: "+4.2% WoW",
      trend: "up",
      description:
        "Combined storytelling experiments in /visit and GM spotlights are accelerating registrations, with ops sharing venue readiness cues ahead of sign-up spikes.",
      personaBreakdown: [
        { persona: "player", value: "+12 sign-ups" },
        { persona: "gm", value: "3 new spotlight features" },
        { persona: "ops", value: "2 venue safety follow-ups" },
      ],
    },
    {
      id: "retention-sync",
      label: "Player retention after ops escalations",
      value: "92%",
      delta: "+2% MoM",
      trend: "steady",
      description:
        "Shared inbox follow-through on safety flags and ops recaps helped keep players in campaigns even when logistics bumped, with admin approvals clearing in under 6 hours.",
      personaBreakdown: [
        { persona: "ops", value: "6 resolved escalations" },
        { persona: "admin", value: "4 approvals", delta: "< 6h" },
        { persona: "player", value: "1 churn risk" },
      ],
    },
    {
      id: "pipeline-health",
      label: "GM pipeline momentum",
      value: "67% on-track",
      delta: "-3% WoW",
      trend: "down",
      description:
        "Alex flagged two campaigns needing extra ops staffing; Priya is sourcing backup specialists while Jordan reviews vendor compliance gaps.",
      personaBreakdown: [
        { persona: "gm", value: "5 campaigns", delta: "2 at-risk" },
        { persona: "ops", value: "3 staffing shifts" },
        { persona: "admin", value: "1 policy exception" },
      ],
    },
  ],
  personaAlignment: [
    {
      persona: "player",
      focus: "Session readiness visibility",
      alignmentScore: 82,
      confidence: "rising",
      keySignals: [
        "Players acknowledge briefings 18h sooner via shared inbox prompts.",
        "Role switch telemetry shows more players previewing ops readiness cards.",
      ],
      openQuestions: [
        "Do RSVP nudges need timezone-aware copy?",
        "Should we expand mobile push for safety acknowledgements?",
      ],
    },
    {
      persona: "ops",
      focus: "Day-of coordination",
      alignmentScore: 76,
      confidence: "steady",
      keySignals: [
        "Runbook exports triggered for 4 major events this week.",
        "Ops leaders reacted to 9 GM pipeline updates directly from the dashboard.",
      ],
      openQuestions: ["Is vendor onboarding status visible early enough for GMs?"],
    },
    {
      persona: "gm",
      focus: "Feedback to backlog loop",
      alignmentScore: 88,
      confidence: "rising",
      keySignals: [
        "Triaged narrative insights surface in admin backlog within 12h.",
        "Players are using quick reactions to confirm debrief priorities.",
      ],
      openQuestions: ["What format should we test for live session sentiment capture?"],
    },
    {
      persona: "admin",
      focus: "Governance visibility",
      alignmentScore: 71,
      confidence: "watch",
      keySignals: [
        "Audit log coverage now includes collaboration quick reactions.",
        "Compliance exports reference persona tags without manual merging.",
      ],
      openQuestions: [
        "Do we need a faster SLA for cross-namespace incident retros?",
        "Which compliance exceptions should trigger auto-escalation?",
      ],
    },
  ],
  collaborationRhythms: [
    {
      id: "campaign-ops-sync",
      title: "Campaign + Ops readiness sync",
      cadence: "Twice weekly",
      ownerPersona: "ops",
      nextSessionAt: "2025-03-19T15:00:00.000Z",
      status: "on-track",
      summary:
        "Shared timeline pairs GM prep checklists with ops staffing, ensuring visitor conversions are supported downstream.",
      linkedThreads: ["thread-ops-venue-access", "thread-gm-feedback-spotlight"],
    },
    {
      id: "feedback-triage",
      title: "Feedback triage standup",
      cadence: "Daily async",
      ownerPersona: "gm",
      nextSessionAt: "2025-03-19T12:00:00.000Z",
      status: "at-risk",
      summary:
        "Two backlog items blocked on admin review; awaiting compliance clarifications before pushing updates live.",
      linkedThreads: ["thread-gm-feedback-spotlight", "thread-admin-policy"],
    },
    {
      id: "governance-review",
      title: "Governance escalation review",
      cadence: "Weekly",
      ownerPersona: "admin",
      nextSessionAt: "2025-03-21T18:00:00.000Z",
      status: "needs-support",
      summary:
        "Jordan flagged staffing signal gaps in the ops dashboard; exploring telemetry hooks to close the loop in near-real time.",
      linkedThreads: ["thread-ops-venue-access"],
    },
  ],
  feedbackLoops: [
    {
      id: "player-post-session",
      persona: "player",
      title: "Post-session pulse",
      prompt: "How supported did you feel coordinating with your GM and ops?",
      participationRate: "68%",
      sentiment: "positive",
      lastUpdatedAt: "2025-03-18T14:00:00.000Z",
      backlogStatus: "in-progress",
      insights: [
        "Players praised the consolidated recap card but requested timezone-aware reminders.",
        "Mobile quick reactions helped surface safety confirmations within minutes.",
      ],
      quickReactions: [
        { id: "player-support", label: "Felt supported", emoji: "👍", count: 42 },
        { id: "player-neutral", label: "Neutral", emoji: "👌", count: 9 },
        { id: "player-friction", label: "Had friction", emoji: "⚠️", count: 4 },
      ],
    },
    {
      id: "ops-runbook",
      persona: "ops",
      title: "Runbook confidence",
      prompt: "Did the shared dashboard keep your team aligned for event day?",
      participationRate: "54%",
      sentiment: "neutral",
      lastUpdatedAt: "2025-03-18T11:30:00.000Z",
      backlogStatus: "triaged",
      insights: [
        "Ops leads want earlier visibility into GM staffing shifts.",
        "Requesting a vendor readiness heatmap inside the reporting view.",
      ],
      quickReactions: [
        { id: "ops-locked", label: "Locked in", emoji: "✅", count: 18 },
        { id: "ops-unclear", label: "Needed clarity", emoji: "❓", count: 12 },
        { id: "ops-blockers", label: "Blocked", emoji: "🚧", count: 5 },
      ],
    },
    {
      id: "gm-creative",
      persona: "gm",
      title: "Creative runway",
      prompt: "Were campaign adjustments easy to socialize across personas?",
      participationRate: "73%",
      sentiment: "positive",
      lastUpdatedAt: "2025-03-18T09:15:00.000Z",
      backlogStatus: "shipped",
      insights: [
        "GM studio updates shipped the new inline annotations last night.",
        "Ops escalations now auto-tag the relevant campaign threads.",
      ],
      quickReactions: [
        { id: "gm-seamless", label: "Seamless", emoji: "✨", count: 27 },
        { id: "gm-okay", label: "Okay", emoji: "🙂", count: 6 },
        { id: "gm-tough", label: "Needs work", emoji: "🛠️", count: 3 },
      ],
    },
    {
      id: "admin-oversight",
      persona: "admin",
      title: "Oversight clarity",
      prompt: "Do the dashboards provide enough context to approve exceptions?",
      participationRate: "61%",
      sentiment: "concerned",
      lastUpdatedAt: "2025-03-17T20:45:00.000Z",
      backlogStatus: "in-progress",
      insights: [
        "Need automated alerts when ops flags stay unresolved past 12h.",
        "Desire for compliance note templates linked to each report tile.",
      ],
      quickReactions: [
        { id: "admin-clear", label: "Crystal clear", emoji: "🧭", count: 11 },
        { id: "admin-followup", label: "Needs follow-up", emoji: "📌", count: 16 },
        { id: "admin-risk", label: "Risky", emoji: "🚨", count: 7 },
      ],
    },
  ],
};
