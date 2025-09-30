import {
  type PersonaId,
  type PersonaInboxConfig,
  type SharedInboxThread,
} from "~/features/inbox/types";

export const PERSONA_INBOX_CONFIG: Record<PersonaId, PersonaInboxConfig> = {
  player: {
    persona: "player",
    heading: "Player shared inbox",
    description: "Keep campaign updates, invites, and safety notes in one timeline.",
    supportingCopy:
      "Leo's workspace bridges GM prep with player commitments so responses stay timely across devices.",
    filters: [
      { id: "all", label: "All updates" },
      { id: "game-updates", label: "Game updates" },
      { id: "team-invitations", label: "Team invitations" },
      { id: "safety", label: "Safety & trust" },
    ],
    highlight: {
      label: "Action needed",
      value: "2 follow-ups",
      description: "Confirm attendance and acknowledge the updated safety briefing.",
    },
    quickMetrics: [
      { id: "upcoming", label: "Upcoming sessions", value: "3" },
      { id: "unread", label: "Unread messages", value: "4", delta: "2 new" },
      { id: "acknowledged", label: "Acknowledged briefs", value: "5/6" },
    ],
    collaborationTips: [
      "Use quick reactions when you just need to confirm a GM note.",
      "Invite teammates into threads instead of forwarding email chains.",
      "Flag safety concerns so ops can escalate without leaving the inbox.",
    ],
  },
  ops: {
    persona: "ops",
    heading: "Operations shared inbox",
    description: "Unify vendor escalations, staffing check-ins, and approval loops.",
    supportingCopy:
      "Priya's team sees what needs attention first, with context for event readiness and guest safety.",
    filters: [
      { id: "all", label: "All threads" },
      { id: "event-alerts", label: "Event alerts" },
      { id: "approvals", label: "Approvals" },
      { id: "vendors", label: "Vendors" },
      { id: "recaps", label: "Recaps" },
    ],
    highlight: {
      label: "Day-of checklist",
      value: "4 blockers",
      description: "Coordinate venue access issues with the GM and platform security.",
    },
    quickMetrics: [
      { id: "alerts", label: "Live alerts", value: "2", delta: "1 new" },
      { id: "approvals", label: "Pending approvals", value: "5" },
      { id: "handoffs", label: "Recent handoffs", value: "8" },
    ],
    collaborationTips: [
      "Attach logistics briefs so GMs can confirm run sheets without digging through docs.",
      "Loop in platform admins when policy exceptions appear.",
      "Use the recap filter to prep async standups.",
    ],
  },
  gm: {
    persona: "gm",
    heading: "Game master shared inbox",
    description:
      "Track narrative tweaks, player reactions, and ops escalations in one place.",
    supportingCopy:
      "Alex coordinates with ops and players while keeping campaign prep unblocked.",
    filters: [
      { id: "all", label: "All threads" },
      { id: "narrative", label: "Narrative" },
      { id: "safety", label: "Safety" },
      { id: "ops-sync", label: "Ops sync" },
      { id: "pipeline", label: "Pipeline" },
    ],
    highlight: {
      label: "Pre-session focus",
      value: "Session 4821",
      description: "Review the updated encounter map and confirm player availability.",
    },
    quickMetrics: [
      { id: "briefs", label: "Briefings sent", value: "4/5" },
      { id: "feedback", label: "Feedback replies", value: "6" },
      { id: "openFlags", label: "Open safety flags", value: "1" },
    ],
    collaborationTips: [
      "Share recaps within the thread so players can react quickly.",
      "Escalate venue issues back to ops with the ops sync filter.",
      "Track pipeline leads without leaving the studio dashboard.",
    ],
  },
  admin: {
    persona: "admin",
    heading: "Platform admin shared inbox",
    description:
      "Centralize compliance escalations, billing follow-ups, and role requests.",
    supportingCopy:
      "Jordan keeps governance loops visible while empowering ops and GM teammates to self-serve.",
    filters: [
      { id: "all", label: "All conversations" },
      { id: "compliance", label: "Compliance" },
      { id: "billing", label: "Billing" },
      { id: "roles", label: "Role requests" },
      { id: "security", label: "Security" },
    ],
    highlight: {
      label: "Escalations",
      value: "1 critical",
      description: "Follow up on the venue compliance exception raised by ops.",
    },
    quickMetrics: [
      { id: "sla", label: "SLA breaches", value: "0" },
      { id: "open", label: "Open threads", value: "9", delta: "-2" },
      { id: "approvals", label: "Role approvals", value: "3" },
    ],
    collaborationTips: [
      "Tag ops leads when compliance reviews need local insight.",
      "Surface billing blockers to finance weekly without duplicating work.",
      "Confirm MFA requirements before approving elevated roles.",
    ],
  },
};

export const SHARED_INBOX_THREADS: SharedInboxThread[] = [
  {
    id: "thread-ops-venue-access",
    subject: "Venue access verification for Saturday session",
    personas: ["ops", "gm", "admin"],
    categories: ["event-alerts", "ops-sync", "security"],
    tags: ["Session 4821", "Venue", "High priority"],
    priority: "high",
    status: "open",
    updatedAt: "2025-03-18T16:45:00.000Z",
    unreadFor: ["admin"],
    preview:
      "Security badge access is pending; need admin override to complete check-in.",
    participants: [
      {
        id: "participant-priya",
        name: "Priya Kapoor",
        persona: "ops",
        roleLabel: "Operations lead",
        avatarInitials: "PK",
      },
      {
        id: "participant-alex",
        name: "Alex Rivers",
        persona: "gm",
        roleLabel: "GM",
        avatarInitials: "AR",
      },
      {
        id: "participant-jordan",
        name: "Jordan Lee",
        persona: "admin",
        roleLabel: "Platform admin",
        avatarInitials: "JL",
      },
    ],
    messages: [
      {
        id: "message-ops-1",
        authorId: "participant-priya",
        persona: "ops",
        timestamp: "2025-03-18T15:05:00.000Z",
        body: "Heads up — the venue's security desk flagged our roster as pending. Need an admin to verify the updated vendor certs before Friday.",
      },
      {
        id: "message-gm-1",
        authorId: "participant-alex",
        persona: "gm",
        timestamp: "2025-03-18T15:17:00.000Z",
        body: "Thanks Priya. I added the new safety checklist to the session brief. If access slips, we can reroute pre-session to the green room.",
      },
      {
        id: "message-admin-1",
        authorId: "participant-jordan",
        persona: "admin",
        timestamp: "2025-03-18T16:30:00.000Z",
        body: "Reviewing now. Logging this as a temporary exception — will confirm credentials within the next hour and update the audit trail.",
      },
    ],
    actionItems: [
      {
        id: "action-admin-verify",
        label: "Verify vendor credentials",
        ownerPersona: "admin",
        dueAt: "2025-03-18T17:30:00.000Z",
        status: "in-progress",
        relatedMessageId: "message-admin-1",
      },
      {
        id: "action-ops-update",
        label: "Share updated access list with venue",
        ownerPersona: "ops",
        status: "open",
      },
    ],
  },
  {
    id: "thread-gm-session-retcon",
    subject: "Session 4821 narrative tweak + player check-in",
    personas: ["gm", "player", "ops"],
    categories: ["narrative", "game-updates", "safety"],
    tags: ["Session 4821", "Narrative"],
    priority: "medium",
    status: "waiting",
    updatedAt: "2025-03-18T14:10:00.000Z",
    unreadFor: ["player"],
    preview:
      "Alex shared an encounter change and needs Leo's thumbs-up on the updated safety veil.",
    participants: [
      {
        id: "participant-alex",
        name: "Alex Rivers",
        persona: "gm",
        roleLabel: "GM",
        avatarInitials: "AR",
      },
      {
        id: "participant-leo",
        name: "Leo Martinez",
        persona: "player",
        roleLabel: "Player",
        avatarInitials: "LM",
      },
      {
        id: "participant-priya",
        name: "Priya Kapoor",
        persona: "ops",
        roleLabel: "Ops partner",
        avatarInitials: "PK",
      },
    ],
    messages: [
      {
        id: "message-gm-2",
        authorId: "participant-alex",
        persona: "gm",
        timestamp: "2025-03-18T13:20:00.000Z",
        body: "Retconning the vault encounter to avoid surprise confinement. Updated the narrative doc and attached the revised veil checklist.",
        attachments: [
          {
            id: "attachment-veil",
            name: "Session-4821-safety-veil.pdf",
          },
        ],
      },
      {
        id: "message-ops-2",
        authorId: "participant-priya",
        persona: "ops",
        timestamp: "2025-03-18T13:35:00.000Z",
        body: "Thanks Alex — logged the change in the operations run sheet. Leo, can you confirm you're good with the adjustment?",
      },
      {
        id: "message-player-1",
        authorId: "participant-leo",
        persona: "player",
        timestamp: "2025-03-18T14:05:00.000Z",
        body: "Appreciate the heads up! Looks good to me. Adding a 👍 reaction so the team sees it's acknowledged.",
        reactions: [{ emoji: "👍", count: 3 }],
      },
    ],
    actionItems: [
      {
        id: "action-player-ack",
        label: "Confirm updated safety veil",
        ownerPersona: "player",
        status: "done",
      },
    ],
  },
  {
    id: "thread-admin-billing",
    subject: "Membership renewal billing exception",
    personas: ["admin", "ops"],
    categories: ["billing", "approvals"],
    tags: ["Billing", "Renewal"],
    priority: "medium",
    status: "open",
    updatedAt: "2025-03-17T19:55:00.000Z",
    unreadFor: ["ops"],
    preview:
      "Finance flagged a renewal discrepancy. Ops needs to confirm member attendance before approving credit.",
    participants: [
      {
        id: "participant-jordan",
        name: "Jordan Lee",
        persona: "admin",
        roleLabel: "Platform admin",
        avatarInitials: "JL",
      },
      {
        id: "participant-priya",
        name: "Priya Kapoor",
        persona: "ops",
        roleLabel: "Operations lead",
        avatarInitials: "PK",
      },
    ],
    messages: [
      {
        id: "message-admin-2",
        authorId: "participant-jordan",
        persona: "admin",
        timestamp: "2025-03-17T19:10:00.000Z",
        body: "Finance requested confirmation that member #8842 attended at least three sessions last quarter before issuing a credit.",
      },
      {
        id: "message-ops-3",
        authorId: "participant-priya",
        persona: "ops",
        timestamp: "2025-03-17T19:45:00.000Z",
        body: "Working on it — pulling attendance now. Expect an update shortly.",
      },
    ],
    actionItems: [
      {
        id: "action-ops-attendance",
        label: "Confirm attendance count",
        ownerPersona: "ops",
        status: "in-progress",
      },
    ],
  },
  {
    id: "thread-player-team-invite",
    subject: "Team Arcane invites Leo to upcoming league",
    personas: ["player"],
    categories: ["team-invitations"],
    tags: ["Teams", "League"],
    priority: "low",
    status: "open",
    updatedAt: "2025-03-16T11:25:00.000Z",
    unreadFor: ["player"],
    preview: "Team Arcane shared registration details and needs a response by Friday.",
    participants: [
      {
        id: "participant-leo",
        name: "Leo Martinez",
        persona: "player",
        roleLabel: "Player",
        avatarInitials: "LM",
      },
      {
        id: "participant-team-arcane",
        name: "Team Arcane",
        persona: "player",
        roleLabel: "Team manager",
        avatarInitials: "TA",
      },
    ],
    messages: [
      {
        id: "message-team-1",
        authorId: "participant-team-arcane",
        persona: "player",
        timestamp: "2025-03-16T11:10:00.000Z",
        body: "Hey Leo! We'd love to roster you for the spring league. Registration closes Friday, and we noted your healer preference.",
      },
      {
        id: "message-player-2",
        authorId: "participant-leo",
        persona: "player",
        timestamp: "2025-03-16T11:24:00.000Z",
        body: "Thanks! Reviewing schedule now — will confirm by Thursday once I double-check ops updates.",
      },
    ],
  },
  {
    id: "thread-crosspersona-retention",
    subject: "Monthly cross-persona retention review",
    personas: ["admin", "ops", "gm", "player"],
    categories: ["recaps", "pipeline", "roles", "compliance"],
    tags: ["Monthly", "Retention"],
    priority: "medium",
    status: "resolved",
    updatedAt: "2025-03-14T09:00:00.000Z",
    unreadFor: [],
    preview:
      "Shared recap from the monthly collaboration review with actions tracked in dashboards.",
    participants: [
      {
        id: "participant-jordan",
        name: "Jordan Lee",
        persona: "admin",
        roleLabel: "Platform admin",
        avatarInitials: "JL",
      },
      {
        id: "participant-priya",
        name: "Priya Kapoor",
        persona: "ops",
        roleLabel: "Operations lead",
        avatarInitials: "PK",
      },
      {
        id: "participant-alex",
        name: "Alex Rivers",
        persona: "gm",
        roleLabel: "GM",
        avatarInitials: "AR",
      },
      {
        id: "participant-leo",
        name: "Leo Martinez",
        persona: "player",
        roleLabel: "Player advisor",
        avatarInitials: "LM",
      },
    ],
    messages: [
      {
        id: "message-admin-3",
        authorId: "participant-jordan",
        persona: "admin",
        timestamp: "2025-03-14T08:10:00.000Z",
        body: "Thanks everyone for the collaboration review. Summaries and metrics are attached; next sync in four weeks.",
      },
      {
        id: "message-ops-4",
        authorId: "participant-priya",
        persona: "ops",
        timestamp: "2025-03-14T08:45:00.000Z",
        body: "Added the event follow-up tasks to ops dashboards. We'll monitor vendor NPS and share deltas weekly.",
      },
      {
        id: "message-gm-3",
        authorId: "participant-alex",
        persona: "gm",
        timestamp: "2025-03-14T08:52:00.000Z",
        body: "Player sentiment trending up 8%. I'll prep spotlight stories for next week's visitor campaigns.",
      },
    ],
  },
];
