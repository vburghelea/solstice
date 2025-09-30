import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import {
  campaigns,
  eventRegistrations,
  events,
  gameParticipants,
  games,
  gmReviews,
  memberships,
  roles,
  user,
  userRoles,
} from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import type {
  CollaborationRhythm,
  CrossNamespaceMetric,
  CrossPersonaReportingSnapshot,
  FeedbackLoopEntry,
  PersonaAlignmentSummary,
} from "~/features/collaboration/types";
import type { PersonaId } from "~/features/inbox/types";
import { OperationResult } from "~/shared/types/common";

const personaSchema = z.enum(["player", "ops", "gm", "admin"] as const);

type DbClient = Awaited<ReturnType<typeof getDb>>;

type EventAggregate = {
  id: string;
  name: string;
  status: string;
  startDate: string | Date;
  updatedAt: Date;
  isPublic: boolean;
  registrationCount: number;
};

type GameAggregate = {
  id: string;
  name: string;
  status: string;
  dateTime: Date;
  ownerId: string | null;
  ownerName: string | null;
};

type RoleAssignment = {
  id: string;
  userId: string;
  userName: string | null;
  roleName: string;
  assignedAt: Date;
  expiresAt: Date | null;
};

type ReviewAggregate = {
  average: number;
  total: number;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

async function fetchUpcomingEvents(db: DbClient): Promise<EventAggregate[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      status: events.status,
      startDate: events.startDate,
      updatedAt: events.updatedAt,
      isPublic: events.isPublic,
      registrationCount: sql<number>`(
        select count(*)::int
        from ${eventRegistrations}
        where ${eventRegistrations.eventId} = ${events.id}
          and ${eventRegistrations.status} != 'canceled'
      )`,
    })
    .from(events)
    .where(gte(events.startDate, todayIso))
    .orderBy(asc(events.startDate))
    .limit(40);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    registrationCount: Number(row.registrationCount ?? 0),
  }));
}

async function fetchUpcomingGames(db: DbClient): Promise<GameAggregate[]> {
  const owner = alias(user, "gm_owner");
  const rows = await db
    .select({
      id: games.id,
      name: games.name,
      status: games.status,
      dateTime: games.dateTime,
      ownerId: owner.id,
      ownerName: owner.name,
    })
    .from(games)
    .leftJoin(owner, eq(games.ownerId, owner.id))
    .where(and(eq(games.status, "scheduled"), gte(games.dateTime, new Date())))
    .orderBy(asc(games.dateTime))
    .limit(40);
  return rows.map((row) => ({
    ...row,
    dateTime: toDate(row.dateTime) ?? new Date(),
  }));
}

async function fetchCampaignCounts(db: DbClient): Promise<Map<string, number>> {
  const rows = await db
    .select({
      status: campaigns.status,
      count: sql<number>`count(*)::int`,
    })
    .from(campaigns)
    .groupBy(campaigns.status);
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.status ?? "unknown", Number(row.count ?? 0));
  });
  return map;
}

async function fetchMembershipCounts(db: DbClient): Promise<Map<string, number>> {
  const rows = await db
    .select({
      status: memberships.status,
      count: sql<number>`count(*)::int`,
    })
    .from(memberships)
    .groupBy(memberships.status);
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.status ?? "unknown", Number(row.count ?? 0));
  });
  return map;
}

async function fetchPendingInvitesCount(db: DbClient): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameParticipants)
    .where(
      and(eq(gameParticipants.status, "pending"), eq(gameParticipants.role, "invited")),
    );
  return Number(rows[0]?.count ?? 0);
}

async function fetchApprovedPlayerCount(db: DbClient): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameParticipants)
    .where(eq(gameParticipants.status, "approved"));
  return Number(rows[0]?.count ?? 0);
}

async function fetchEventRegistrationCount(db: DbClient): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventRegistrations);
  return Number(rows[0]?.count ?? 0);
}

async function fetchRoleAssignments(db: DbClient): Promise<RoleAssignment[]> {
  const rows = await db
    .select({
      id: userRoles.id,
      userId: user.id,
      userName: user.name,
      roleName: roles.name,
      assignedAt: userRoles.assignedAt,
      expiresAt: userRoles.expiresAt,
    })
    .from(userRoles)
    .innerJoin(user, eq(userRoles.userId, user.id))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .orderBy(desc(userRoles.assignedAt))
    .limit(50);
  return rows.map((row) => ({
    ...row,
    assignedAt: toDate(row.assignedAt) ?? new Date(),
    expiresAt: toDate(row.expiresAt),
  }));
}

async function fetchReviewAggregate(db: DbClient): Promise<ReviewAggregate> {
  const rows = await db
    .select({
      average: sql<number>`coalesce(avg(${gmReviews.rating}),0)`,
      total: sql<number>`count(*)::int`,
    })
    .from(gmReviews);
  const aggregate = rows[0];
  return {
    average: Number(aggregate?.average ?? 0),
    total: Number(aggregate?.total ?? 0),
  };
}

function computeTrend(value: number): "up" | "steady" | "down" {
  if (value >= 0.65) {
    return "up";
  }
  if (value >= 0.45) {
    return "steady";
  }
  return "down";
}

function toPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function buildPersonaAlignment(
  persona: PersonaId,
  focus: string,
  score: number,
  confidence: "rising" | "steady" | "watch",
  keySignals: string[],
  openQuestions: string[],
): PersonaAlignmentSummary {
  return {
    persona,
    focus,
    alignmentScore: Math.max(0, Math.min(100, Math.round(score))),
    confidence,
    keySignals,
    openQuestions,
  } satisfies PersonaAlignmentSummary;
}

function buildRhythm(
  id: string,
  title: string,
  cadence: string,
  ownerPersona: PersonaId,
  nextSessionAt: Date | null,
  status: CollaborationRhythm["status"],
  summary: string,
  linkedThreads: string[],
): CollaborationRhythm {
  return {
    id,
    title,
    cadence,
    ownerPersona,
    nextSessionAt: (nextSessionAt ?? new Date()).toISOString(),
    status,
    summary,
    linkedThreads,
  } satisfies CollaborationRhythm;
}

function buildFeedbackEntry(
  id: string,
  persona: PersonaId,
  title: string,
  prompt: string,
  participationRate: string,
  sentiment: FeedbackLoopEntry["sentiment"],
  insights: string[],
  quickReactions: FeedbackLoopEntry["quickReactions"],
): FeedbackLoopEntry {
  return {
    id,
    persona,
    title,
    prompt,
    participationRate,
    sentiment,
    lastUpdatedAt: new Date().toISOString(),
    backlogStatus:
      sentiment === "concerned"
        ? "in-progress"
        : sentiment === "neutral"
          ? "triaged"
          : "shipped",
    insights,
    quickReactions,
  } satisfies FeedbackLoopEntry;
}

export const getCrossPersonaCollaborationSnapshot = createServerFn({ method: "POST" })
  .validator(
    z.object({
      activePersona: personaSchema,
      userId: z.string().nullish(),
    }).parse,
  )
  .handler(async ({ data }): Promise<OperationResult<CrossPersonaReportingSnapshot>> => {
    try {
      const db = await getDb();
      const [
        eventsList,
        gamesList,
        campaignCounts,
        membershipCounts,
        pendingInvitesCount,
        approvedPlayersCount,
        registrationCount,
        roleAssignments,
        reviewAggregate,
      ] = await Promise.all([
        fetchUpcomingEvents(db),
        fetchUpcomingGames(db),
        fetchCampaignCounts(db),
        fetchMembershipCounts(db),
        fetchPendingInvitesCount(db),
        fetchApprovedPlayerCount(db),
        fetchEventRegistrationCount(db),
        fetchRoleAssignments(db),
        fetchReviewAggregate(db),
      ]);

      const totalEvents = eventsList.length;
      const registrationOpenCount = eventsList.filter(
        (event) => event.status === "registration_open",
      ).length;
      const draftCount = eventsList.filter((event) => event.status === "draft").length;
      const publicCount = eventsList.filter((event) => event.isPublic).length;
      const openRatio = totalEvents ? registrationOpenCount / totalEvents : 0;

      const uniqueGmCount = new Set(gamesList.map((game) => game.ownerId).filter(Boolean))
        .size;
      const gamesScheduled = gamesList.length;
      const activeCampaigns = campaignCounts.get("active") ?? 0;
      const completedCampaigns = campaignCounts.get("completed") ?? 0;
      const activeMemberships = membershipCounts.get("active") ?? 0;
      const expiredMemberships = membershipCounts.get("expired") ?? 0;

      const expiringRoles = roleAssignments.filter(
        (assignment) =>
          assignment.expiresAt !== null &&
          assignment.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ).length;

      const activitySummary = [
        totalEvents
          ? `${totalEvents} upcoming event${totalEvents === 1 ? "" : "s"}`
          : "No upcoming events yet",
        gamesScheduled
          ? `${gamesScheduled} scheduled session${gamesScheduled === 1 ? "" : "s"}`
          : "No scheduled sessions",
        activeCampaigns
          ? `${activeCampaigns} active campaign${activeCampaigns === 1 ? "" : "s"}`
          : "No active campaigns",
        completedCampaigns
          ? `${completedCampaigns} completed campaign${completedCampaigns === 1 ? "" : "s"} this month`
          : "No completed campaigns wrapped this month",
      ].join(", ");

      const personaCallout = (() => {
        switch (data.activePersona) {
          case "player":
            return "Players can jump straight into scheduled sessions that already include ops coordination.";
          case "ops":
            return "Ops leads see which campaigns need approvals before the weekend and who is covering each shift.";
          case "gm":
            return "GMs get a queue of upcoming tables plus cross-persona notes pulled from the shared inbox.";
          case "admin":
            return "Admins can audit memberships, governance tasks, and backlog reactions at a glance.";
          default:
            return "Stay aligned with cross-persona updates from collaboration and inbox workspaces.";
        }
      })();

      const summary = `${activitySummary}. ${pendingInvitesCount} player invite${
        pendingInvitesCount === 1 ? "" : "s"
      } and ${registrationCount} total RSVP${registrationCount === 1 ? "" : "s"} are powering collaboration across personas. ${personaCallout}`;

      const metrics: CrossNamespaceMetric[] = [
        {
          id: "event-readiness",
          label: "Event pipeline readiness",
          value: `${registrationOpenCount}/${totalEvents || 1} open`,
          delta: `${toPercentage(openRatio || 0)} ready`,
          trend: computeTrend(openRatio || 0),
          description:
            "Operations and admin are moving events through approvals while players fill seats and GMs prepare sessions.",
          personaBreakdown: [
            { persona: "player", value: `${registrationCount} RSVPs` },
            { persona: "ops", value: `${draftCount} approvals` },
            { persona: "gm", value: `${uniqueGmCount} active GMs` },
            { persona: "admin", value: `${publicCount} public` },
          ],
        },
        {
          id: "player-engagement",
          label: "Player engagement",
          value: `${approvedPlayersCount} players confirmed`,
          ...(pendingInvitesCount
            ? {
                delta: `${pendingInvitesCount} invite${
                  pendingInvitesCount === 1 ? "" : "s"
                } waiting`,
              }
            : {}),
          trend: computeTrend(
            (approvedPlayersCount || 0) /
              Math.max(1, approvedPlayersCount + pendingInvitesCount),
          ),
          description:
            "Players are joining sessions and campaigns as GMs publish new tables and ops keep the pipeline healthy.",
          personaBreakdown: [
            { persona: "player", value: `${approvedPlayersCount} confirmed` },
            { persona: "gm", value: `${gamesScheduled} sessions` },
            { persona: "ops", value: `${registrationCount} event RSVPs` },
            { persona: "admin", value: `${activeCampaigns} active campaigns` },
          ],
        },
        {
          id: "governance-coverage",
          label: "Governance coverage",
          value: `${activeMemberships} active membership${activeMemberships === 1 ? "" : "s"}`,
          ...(expiringRoles
            ? {
                delta: `${expiringRoles} role${expiringRoles === 1 ? "" : "s"} expiring soon`,
              }
            : {}),
          trend: computeTrend(
            activeMemberships
              ? activeMemberships / Math.max(activeMemberships + expiringRoles, 1)
              : 0,
          ),
          description:
            "Admin and ops maintain compliance, membership renewals, and access controls across personas.",
          personaBreakdown: [
            { persona: "admin", value: `${activeMemberships} memberships` },
            { persona: "ops", value: `${publicCount} public events` },
            {
              persona: "gm",
              value: `${Math.round((reviewAggregate.average || 0) * 10) / 10}★ avg`,
              delta: `${reviewAggregate.total} review${reviewAggregate.total === 1 ? "" : "s"}`,
            },
            { persona: "player", value: `${pendingInvitesCount} open invites` },
          ],
        },
      ];

      const playerEngagementRatio =
        (approvedPlayersCount || 0) /
        Math.max(approvedPlayersCount + pendingInvitesCount, 1);
      const playerConfidence: "rising" | "steady" | "watch" =
        playerEngagementRatio > 0.65
          ? "rising"
          : playerEngagementRatio > 0.45
            ? "steady"
            : "watch";

      const opsConfidence: "rising" | "steady" | "watch" =
        openRatio > 0.7 ? "rising" : openRatio > 0.5 ? "steady" : "watch";

      const gmConfidence: "rising" | "steady" | "watch" =
        reviewAggregate.average >= 4
          ? "rising"
          : reviewAggregate.average >= 3.5
            ? "steady"
            : "watch";

      const adminConfidence: "rising" | "steady" | "watch" =
        expiringRoles === 0 && expiredMemberships === 0
          ? "rising"
          : expiringRoles <= 3
            ? "steady"
            : "watch";
      const adminSentiment: FeedbackLoopEntry["sentiment"] =
        adminConfidence === "rising"
          ? "positive"
          : adminConfidence === "steady"
            ? "neutral"
            : "concerned";

      const personaAlignment: PersonaAlignmentSummary[] = [
        buildPersonaAlignment(
          "player",
          "Session readiness",
          60 + playerEngagementRatio * 40,
          playerConfidence,
          [
            `${approvedPlayersCount} confirmed players across upcoming sessions`,
            pendingInvitesCount
              ? `${pendingInvitesCount} invites awaiting responses`
              : "All invitations responded to",
          ],
          pendingInvitesCount
            ? [
                "Do invite reminders need additional context for quicker responses?",
                "Should we surface GM availability alongside invites?",
              ]
            : ["Which campaigns should we spotlight for new players next?"],
        ),
        buildPersonaAlignment(
          "ops",
          "Event pipeline",
          58 + openRatio * 42,
          opsConfidence,
          [
            `${registrationOpenCount} events open for registration`,
            `${draftCount} draft${draftCount === 1 ? "" : "s"} awaiting approval`,
          ],
          [
            draftCount
              ? "Which approvals are blocked on compliance or vendor tasks?"
              : "Can we accelerate marketing boosts for events nearing capacity?",
          ],
        ),
        buildPersonaAlignment(
          "gm",
          "Campaign momentum",
          62 + Math.min(1, gamesScheduled / Math.max(1, activeCampaigns || 1)) * 38,
          gmConfidence,
          [
            `${gamesScheduled} scheduled session${gamesScheduled === 1 ? "" : "s"}`,
            `${reviewAggregate.total} recent review${reviewAggregate.total === 1 ? "" : "s"}`,
          ],
          [
            reviewAggregate.average < 4
              ? "What feedback themes should we address in the next sprint?"
              : "How can we scale narrative tooling to new campaigns?",
          ],
        ),
        buildPersonaAlignment(
          "admin",
          "Governance readiness",
          65 +
            (activeMemberships
              ? Math.min(activeMemberships / Math.max(expiringRoles, 1), 1) * 35
              : 0),
          adminConfidence,
          [
            `${activeMemberships} active membership${activeMemberships === 1 ? "" : "s"}`,
            expiringRoles
              ? `${expiringRoles} role${expiringRoles === 1 ? "" : "s"} expiring soon`
              : "No roles nearing expiry",
          ],
          expiringRoles
            ? [
                "Do we need automated reminders for roles nearing expiration?",
                "Which compliance audits require deeper review?",
              ]
            : ["Which data sources should we surface next in the compliance export?"],
        ),
      ];

      const earliestEvent = eventsList.reduce<Date | null>((acc, event) => {
        const start = toDate(event.startDate);
        if (!start) {
          return acc;
        }
        if (!acc || start < acc) {
          return start;
        }
        return acc;
      }, null);

      const earliestGame = gamesList.reduce<Date | null>((acc, game) => {
        if (!acc || game.dateTime < acc) {
          return game.dateTime;
        }
        return acc;
      }, null);

      const nextRoleExpiry = roleAssignments.reduce<Date | null>((acc, assignment) => {
        if (!assignment.expiresAt) {
          return acc;
        }
        if (!acc || assignment.expiresAt < acc) {
          return assignment.expiresAt;
        }
        return acc;
      }, null);

      const collaborationRhythms: CollaborationRhythm[] = [
        buildRhythm(
          "event-ops-sync",
          "Event launch readiness",
          "Twice weekly",
          "ops",
          earliestEvent,
          draftCount || openRatio < 0.5
            ? "needs-support"
            : openRatio < 0.7
              ? "at-risk"
              : "on-track",
          draftCount
            ? "Approvals remain in review; align with admin on compliance blockers."
            : "Registration pacing looks healthy—coordinate with marketing for final pushes.",
          eventsList.slice(0, 3).map((event) => `ops-event-${event.id}`),
        ),
        buildRhythm(
          "gm-feedback-loop",
          "GM pipeline sync",
          "Weekly",
          "gm",
          earliestGame,
          gamesScheduled ? "on-track" : "needs-support",
          gamesScheduled
            ? "Sessions scheduled—share narrative briefs and capture post-session notes."
            : "No sessions scheduled yet. Plan upcoming campaigns with ops.",
          gamesList.slice(0, 3).map((game) => `gm-session-${game.id}`),
        ),
        buildRhythm(
          "admin-governance-review",
          "Governance review",
          "Weekly",
          "admin",
          nextRoleExpiry,
          expiringRoles ? "at-risk" : "on-track",
          expiringRoles
            ? "Role expirations approaching—confirm least-privilege scopes and renewals."
            : "Governance coverage is steady—monitor compliance exports for anomalies.",
          roleAssignments.slice(0, 3).map((assignment) => `admin-role-${assignment.id}`),
        ),
      ];

      const feedbackLoops: FeedbackLoopEntry[] = [
        buildFeedbackEntry(
          "player-pulse",
          "player",
          "Post-session pulse",
          "How supported did you feel coordinating with your GM and ops?",
          toPercentage(playerEngagementRatio || 0.5),
          playerEngagementRatio > 0.65
            ? "positive"
            : playerEngagementRatio > 0.45
              ? "neutral"
              : "concerned",
          [
            `${approvedPlayersCount} players confirmed upcoming sessions.`,
            pendingInvitesCount
              ? `${pendingInvitesCount} invitations still need responses.`
              : "All invitations confirmed across the platform.",
          ],
          [
            {
              id: "player-positive",
              label: "Felt supported",
              emoji: "👍",
              count: approvedPlayersCount,
            },
            {
              id: "player-waiting",
              label: "Waiting to confirm",
              emoji: "⏳",
              count: pendingInvitesCount,
            },
            {
              id: "player-questions",
              label: "Need info",
              emoji: "❓",
              count: Math.max(0, pendingInvitesCount - approvedPlayersCount),
            },
          ],
        ),
        buildFeedbackEntry(
          "ops-runbook",
          "ops",
          "Runbook confidence",
          "Did the shared dashboard keep your team aligned for event day?",
          toPercentage(openRatio || 0.5),
          openRatio > 0.7 ? "positive" : openRatio > 0.5 ? "neutral" : "concerned",
          [
            `${registrationOpenCount} events open for registration.`,
            draftCount
              ? `${draftCount} draft event${draftCount === 1 ? "" : "s"} awaiting approval.`
              : "No draft events awaiting approval.",
          ],
          [
            {
              id: "ops-ready",
              label: "Ready",
              emoji: "✅",
              count: registrationOpenCount,
            },
            { id: "ops-review", label: "Needs review", emoji: "🛠️", count: draftCount },
            { id: "ops-monitor", label: "Monitoring", emoji: "👀", count: publicCount },
          ],
        ),
        buildFeedbackEntry(
          "gm-sentiment",
          "gm",
          "Creative runway",
          "Were campaign adjustments easy to socialize across personas?",
          toPercentage(Math.min(1, reviewAggregate.average / 5) || 0.5),
          reviewAggregate.average >= 4
            ? "positive"
            : reviewAggregate.average >= 3.5
              ? "neutral"
              : "concerned",
          [
            `${gamesScheduled} sessions scheduled with cross-persona context.`,
            `${reviewAggregate.total} GM review${reviewAggregate.total === 1 ? "" : "s"} collected platform-wide.`,
          ],
          [
            {
              id: "gm-glow",
              label: "Glowing",
              emoji: "✨",
              count: Math.round(
                reviewAggregate.total * Math.min(reviewAggregate.average / 5, 1),
              ),
            },
            {
              id: "gm-solid",
              label: "Solid",
              emoji: "🙂",
              count: Math.round(reviewAggregate.total * 0.2),
            },
            {
              id: "gm-tune",
              label: "Needs tuning",
              emoji: "🛠️",
              count: Math.max(
                0,
                reviewAggregate.total -
                  Math.round(
                    reviewAggregate.total *
                      (Math.min(reviewAggregate.average / 5, 1) + 0.2),
                  ),
              ),
            },
          ],
        ),
        buildFeedbackEntry(
          "admin-audit",
          "admin",
          "Governance audit",
          "Are compliance exports and role reviews keeping pace with changes?",
          toPercentage(
            activeMemberships
              ? activeMemberships / Math.max(activeMemberships + expiringRoles, 1)
              : 0.5,
          ),
          adminSentiment,
          [
            `${activeMemberships} active membership${activeMemberships === 1 ? "" : "s"} across the platform.`,
            expiringRoles
              ? `${expiringRoles} role${expiringRoles === 1 ? "" : "s"} expiring in the next week.`
              : "No roles nearing expiration this week.",
          ],
          [
            {
              id: "admin-clear",
              label: "Audit ready",
              emoji: "🧾",
              count: activeMemberships,
            },
            {
              id: "admin-expiring",
              label: "Expiring soon",
              emoji: "⏰",
              count: expiringRoles,
            },
            {
              id: "admin-watch",
              label: "On watch",
              emoji: "👁️",
              count: expiredMemberships,
            },
          ],
        ),
      ];

      const snapshot: CrossPersonaReportingSnapshot = {
        updatedAt: new Date().toISOString(),
        summary,
        metrics,
        personaAlignment,
        collaborationRhythms,
        feedbackLoops,
      };

      return { success: true, data: snapshot };
    } catch (error) {
      console.error("Failed to load collaboration snapshot", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to load collaboration workspace",
          },
        ],
      };
    }
  });
