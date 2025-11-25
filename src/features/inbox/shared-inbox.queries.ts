import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import {
  campaignParticipants,
  campaigns,
  eventRegistrations,
  events,
  gameParticipants,
  games,
  gameSystems,
  memberships,
  roles,
  user,
  userRoles,
} from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import type {
  PersonaId,
  SharedInboxActionItem,
  SharedInboxSnapshot,
  SharedInboxThread,
} from "~/features/inbox/types";
import { OperationResult } from "~/shared/types/common";

const personaSchema = z.enum(["player", "ops", "gm", "admin"] as const);

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

type DbClient = Awaited<ReturnType<typeof getDb>>;

type PersonaContact = {
  id: string;
  name: string;
  email: string | null;
  persona: PersonaId;
};

interface ContextUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface PlayerInviteRow {
  id: string;
  updatedAt: Date;
  gameId: string;
  gameName: string;
  gameStatus: string;
  gameDate: Date;
  gmId: string | null;
  gmName: string | null;
  gmEmail: string | null;
  systemName: string | null;
  systemSlug: string | null;
  location: unknown;
}

interface PlayerSessionRow {
  id: string;
  updatedAt: Date;
  gameId: string;
  gameName: string;
  gameStatus: string;
  gameDate: Date;
  gmId: string | null;
  gmName: string | null;
  gmEmail: string | null;
  systemName: string | null;
  systemSlug: string | null;
  location: unknown;
  participantCount: number;
}

interface PlayerRegistrationRow {
  id: string;
  status: string;
  updatedAt: Date;
  eventId: string;
  eventName: string;
  eventStatus: string;
  registrationType: string;
  startDate: string | Date;
  endDate: string | Date;
  city: string | null;
  country: string | null;
  organizerId: string | null;
  organizerName: string | null;
  organizerEmail: string | null;
}

interface OpsEventRow {
  id: string;
  name: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  city: string | null;
  country: string | null;
  updatedAt: Date;
  registrationType: string;
  maxTeams: number | null;
  maxParticipants: number | null;
  registrationCount: number;
  isPublic: boolean;
  organizerId: string | null;
  organizerName: string | null;
  organizerEmail: string | null;
}

interface GmCampaignRow {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
  recurrence: string;
  timeOfDay: string;
  sessionDuration: number;
  pricePerSession: number | null;
  systemName: string | null;
  location: unknown;
  participantCount: number;
}

interface GmGameRow {
  id: string;
  name: string;
  status: string;
  dateTime: Date;
  updatedAt: Date;
  participantCount: number;
  systemName: string | null;
  location: unknown;
}

interface RoleAssignmentRow {
  id: string;
  roleName: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  notes: string | null;
}

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

function formatDateTime(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "TBD";
  }
  return dateTimeFormatter.format(date);
}

function formatDateOnly(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "TBD";
  }
  return dateFormatter.format(date);
}

function initialsFromName(name: string | null | undefined, fallback = "?"): string {
  if (!name) {
    return fallback;
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return fallback;
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function extractLocationLabel(raw: unknown): string | null {
  if (!raw) {
    return null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return extractLocationLabel(parsed);
    } catch {
      return raw;
    }
  }
  if (typeof raw !== "object") {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const labelValue = source["label"];
  const label = typeof labelValue === "string" ? labelValue : null;
  if (label) {
    return label;
  }
  const nameValue = source["name"];
  const cityValue = source["city"];
  const countryValue = source["country"];
  const name = typeof nameValue === "string" ? nameValue : null;
  const city = typeof cityValue === "string" ? cityValue : null;
  const country = typeof countryValue === "string" ? countryValue : null;
  if (name) {
    return name;
  }
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) {
    return city;
  }
  return null;
}

async function fetchContextUser(
  db: DbClient,
  userId: string | null | undefined,
): Promise<ContextUser | null> {
  if (!userId) {
    return null;
  }
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const record = rows[0];
  if (!record) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    email: record.email,
  } satisfies ContextUser;
}

async function findUserByRoleKeyword(
  db: DbClient,
  keyword: string,
  persona: PersonaId,
): Promise<PersonaContact | null> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(user, eq(userRoles.userId, user.id))
    .where(ilike(roles.name, `%${keyword}%`))
    .orderBy(desc(userRoles.assignedAt))
    .limit(1);
  const contact = rows[0];
  if (!contact) {
    return null;
  }
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    persona,
  } satisfies PersonaContact;
}

async function findGmContact(db: DbClient): Promise<PersonaContact | null> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.isGM, true))
    .orderBy(desc(user.updatedAt))
    .limit(1);
  const contact = rows[0];
  if (!contact) {
    return null;
  }
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    persona: "gm",
  } satisfies PersonaContact;
}

function resolvePersonaContact(
  fallback: PersonaContact | null,
  override?: PersonaContact | null,
): PersonaContact | null {
  if (override) {
    return override;
  }
  return fallback ?? null;
}

function buildParticipant(
  contact: PersonaContact | null,
  fallbackLabel: string,
): SharedInboxThread["participants"][number] {
  const name = contact?.name ?? fallbackLabel;
  return {
    id: contact?.id ?? fallbackLabel,
    name,
    persona: contact?.persona ?? "player",
    roleLabel: fallbackLabel,
    avatarInitials: initialsFromName(name, fallbackLabel.slice(0, 2).toUpperCase()),
  };
}

async function fetchPlayerInvites(
  db: DbClient,
  userId: string,
): Promise<PlayerInviteRow[]> {
  const gmUser = alias(user, "gm_user");
  const rows = await db
    .select({
      id: gameParticipants.id,
      updatedAt: gameParticipants.updatedAt,
      gameId: games.id,
      gameName: games.name,
      gameStatus: games.status,
      gameDate: games.dateTime,
      gmId: gmUser.id,
      gmName: gmUser.name,
      gmEmail: gmUser.email,
      systemName: gameSystems.name,
      systemSlug: gameSystems.slug,
      location: games.location,
    })
    .from(gameParticipants)
    .innerJoin(games, eq(gameParticipants.gameId, games.id))
    .leftJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
    .leftJoin(gmUser, eq(games.ownerId, gmUser.id))
    .where(
      and(
        eq(gameParticipants.userId, userId),
        eq(gameParticipants.role, "invited"),
        eq(gameParticipants.status, "pending"),
        gte(games.dateTime, new Date()),
      ),
    )
    .orderBy(asc(games.dateTime))
    .limit(8);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    gameDate: toDate(row.gameDate) ?? new Date(),
  }));
}

async function fetchPlayerSessions(
  db: DbClient,
  userId: string,
): Promise<PlayerSessionRow[]> {
  const gmUser = alias(user, "gm_session_user");
  const rows = await db
    .select({
      id: gameParticipants.id,
      updatedAt: gameParticipants.updatedAt,
      gameId: games.id,
      gameName: games.name,
      gameStatus: games.status,
      gameDate: games.dateTime,
      gmId: gmUser.id,
      gmName: gmUser.name,
      gmEmail: gmUser.email,
      systemName: gameSystems.name,
      systemSlug: gameSystems.slug,
      location: games.location,
      participantCount: sql<number>`count(${gameParticipants.userId}) over (partition by ${gameParticipants.gameId})::int`,
    })
    .from(gameParticipants)
    .innerJoin(games, eq(gameParticipants.gameId, games.id))
    .leftJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
    .leftJoin(gmUser, eq(games.ownerId, gmUser.id))
    .where(
      and(
        eq(gameParticipants.userId, userId),
        eq(gameParticipants.role, "player"),
        eq(gameParticipants.status, "approved"),
        gte(games.dateTime, new Date()),
      ),
    )
    .orderBy(asc(games.dateTime))
    .limit(8);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    gameDate: toDate(row.gameDate) ?? new Date(),
    participantCount: Number(row.participantCount ?? 0),
  }));
}

async function fetchPlayerRegistrations(
  db: DbClient,
  userId: string,
): Promise<PlayerRegistrationRow[]> {
  const organizer = alias(user, "event_organizer");
  const rows = await db
    .select({
      id: eventRegistrations.id,
      status: eventRegistrations.status,
      updatedAt: eventRegistrations.updatedAt,
      eventId: events.id,
      eventName: events.name,
      eventStatus: events.status,
      registrationType: eventRegistrations.registrationType,
      startDate: events.startDate,
      endDate: events.endDate,
      city: events.city,
      country: events.country,
      organizerId: organizer.id,
      organizerName: organizer.name,
      organizerEmail: organizer.email,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .leftJoin(organizer, eq(events.organizerId, organizer.id))
    .where(eq(eventRegistrations.userId, userId))
    .orderBy(desc(eventRegistrations.updatedAt))
    .limit(8);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  }));
}

async function fetchOpsEvents(db: DbClient): Promise<OpsEventRow[]> {
  const organizer = alias(user, "ops_event_organizer");
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      status: events.status,
      startDate: events.startDate,
      endDate: events.endDate,
      city: events.city,
      country: events.country,
      updatedAt: events.updatedAt,
      registrationType: events.registrationType,
      maxTeams: events.maxTeams,
      maxParticipants: events.maxParticipants,
      registrationCount: sql<number>`(
        select count(*)::int
        from ${eventRegistrations}
        where ${eventRegistrations.eventId} = ${events.id}
          and ${eventRegistrations.status} != 'canceled'
      )`,
      isPublic: events.isPublic,
      organizerId: organizer.id,
      organizerName: organizer.name,
      organizerEmail: organizer.email,
    })
    .from(events)
    .leftJoin(organizer, eq(events.organizerId, organizer.id))
    .where(gte(events.startDate, todayIso))
    .orderBy(asc(events.startDate))
    .limit(25);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  }));
}

async function fetchGmCampaigns(db: DbClient, userId: string): Promise<GmCampaignRow[]> {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      updatedAt: campaigns.updatedAt,
      recurrence: campaigns.recurrence,
      timeOfDay: campaigns.timeOfDay,
      sessionDuration: campaigns.sessionDuration,
      pricePerSession: campaigns.pricePerSession,
      systemName: gameSystems.name,
      location: campaigns.location,
      participantCount: sql<number>`(
        select count(*)::int
        from ${campaignParticipants}
        where ${campaignParticipants.campaignId} = ${campaigns.id}
          and ${campaignParticipants.status} = 'approved'
      )`,
    })
    .from(campaigns)
    .leftJoin(gameSystems, eq(campaigns.gameSystemId, gameSystems.id))
    .where(eq(campaigns.ownerId, userId))
    .orderBy(desc(campaigns.updatedAt))
    .limit(12);
  return rows.map((row) => ({
    ...row,
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    participantCount: Number(row.participantCount ?? 0),
  }));
}

async function fetchGmGames(db: DbClient, userId: string): Promise<GmGameRow[]> {
  const rows = await db
    .select({
      id: games.id,
      name: games.name,
      status: games.status,
      dateTime: games.dateTime,
      updatedAt: games.updatedAt,
      participantCount: sql<number>`(
        select count(*)::int
        from ${gameParticipants}
        where ${gameParticipants.gameId} = ${games.id}
          and ${gameParticipants.status} = 'approved'
      )`,
      systemName: gameSystems.name,
      location: games.location,
    })
    .from(games)
    .leftJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
    .where(and(eq(games.ownerId, userId), gte(games.dateTime, new Date())))
    .orderBy(asc(games.dateTime))
    .limit(12);
  return rows.map((row) => ({
    ...row,
    dateTime: toDate(row.dateTime) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    participantCount: Number(row.participantCount ?? 0),
  }));
}

async function fetchRecentRoleAssignments(db: DbClient): Promise<RoleAssignmentRow[]> {
  const rows = await db
    .select({
      id: userRoles.id,
      roleName: roles.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      assignedAt: userRoles.assignedAt,
      expiresAt: userRoles.expiresAt,
      notes: userRoles.notes,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(user, eq(userRoles.userId, user.id))
    .orderBy(desc(userRoles.assignedAt))
    .limit(12);
  return rows.map((row) => ({
    ...row,
    assignedAt: toDate(row.assignedAt) ?? new Date(),
    expiresAt: toDate(row.expiresAt),
  }));
}

function computeAvailableSpots(event: OpsEventRow): number | null {
  if (event.registrationType === "team" && typeof event.maxTeams === "number") {
    return Math.max(0, event.maxTeams - event.registrationCount);
  }
  if (
    event.registrationType === "individual" &&
    typeof event.maxParticipants === "number"
  ) {
    return Math.max(0, event.maxParticipants - event.registrationCount);
  }
  return null;
}

function buildActionItem(
  id: string,
  label: string,
  ownerPersona: PersonaId,
  dueAt: Date | null,
  status: "open" | "in-progress" | "done" = "open",
): SharedInboxActionItem {
  return {
    id,
    label,
    ownerPersona,
    status,
    ...(dueAt ? { dueAt: dueAt.toISOString() } : {}),
  };
}

function buildMessage(
  id: string,
  author: PersonaContact | null,
  timestamp: Date,
  body: string,
): SharedInboxThread["messages"][number] {
  return {
    id,
    authorId: author?.id ?? id,
    persona: author?.persona ?? "player",
    timestamp: timestamp.toISOString(),
    body,
  };
}

function sortThreads(threads: SharedInboxThread[]): SharedInboxThread[] {
  return [...threads].sort((a, b) => {
    const aTime = toDate(a.updatedAt)?.getTime() ?? 0;
    const bTime = toDate(b.updatedAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

async function buildPlayerSnapshot(
  db: DbClient,
  contextUser: ContextUser | null,
): Promise<SharedInboxSnapshot> {
  if (!contextUser) {
    return {
      config: {
        persona: "player",
        heading: "Player shared inbox",
        description: "Keep campaign updates, invites, and safety notes in one timeline.",
        supportingCopy:
          "Sign in to view game invitations and upcoming sessions tailored to your profile.",
        filters: [
          { id: "all", label: "All updates" },
          { id: "game-updates", label: "Game updates" },
          { id: "team-invitations", label: "Team invitations" },
          { id: "events", label: "Events & RSVPs" },
        ],
        highlight: {
          label: "Action needed",
          value: "Sign in",
          description: "Authenticate to load your player alerts and session reminders.",
        },
        quickMetrics: [
          { id: "upcoming", label: "Upcoming sessions", value: "—" },
          { id: "invites", label: "Pending invites", value: "—" },
          { id: "events", label: "Event RSVPs", value: "—" },
        ],
        collaborationTips: [
          "Switch personas to compare how GMs and ops see the same conversations.",
          "Account linking unlocks RSVP history in the collaboration workspace.",
          "Safety confirmations appear here once you join a campaign.",
        ],
      },
      threads: [],
    } satisfies SharedInboxSnapshot;
  }

  const [invites, sessions, registrations] = await Promise.all([
    fetchPlayerInvites(db, contextUser.id),
    fetchPlayerSessions(db, contextUser.id),
    fetchPlayerRegistrations(db, contextUser.id),
  ]);

  const playerContact: PersonaContact = {
    id: contextUser.id,
    name: contextUser.name ?? contextUser.email ?? "Player",
    email: contextUser.email,
    persona: "player",
  };

  const gmFallback = await findGmContact(db);
  const opsFallback = await findUserByRoleKeyword(db, "Ops", "ops");
  const adminFallback =
    (await findUserByRoleKeyword(db, "Admin", "admin")) ??
    ({
      id: "platform-admin",
      name: "Platform admin",
      email: null,
      persona: "admin",
    } satisfies PersonaContact);

  const threads: SharedInboxThread[] = [];

  invites.forEach((invite) => {
    const gmContact = resolvePersonaContact(
      gmFallback,
      invite.gmId
        ? {
            id: invite.gmId,
            name: invite.gmName ?? "Game master",
            email: invite.gmEmail ?? null,
            persona: "gm",
          }
        : null,
    );
    const actionDue = new Date(invite.gameDate.getTime() - 12 * 60 * 60 * 1000);
    const locationLabel = extractLocationLabel(invite.location);
    threads.push({
      id: `player-invite-${invite.id}`,
      subject: `Respond to ${invite.gameName}`,
      personas: ["player", "gm"],
      categories: ["team-invitations"],
      tags: [invite.systemName ?? "Unspecified system", locationLabel ?? "Online"],
      priority: "high",
      status: "waiting",
      updatedAt: invite.updatedAt.toISOString(),
      unreadFor: ["player"],
      preview: `GM ${gmContact?.name ?? "contact"} is holding a seat for ${formatDateTime(
        invite.gameDate,
      )}.`,
      participants: [
        buildParticipant(playerContact, "Player"),
        buildParticipant(gmContact, "Game master"),
      ],
      messages: [
        buildMessage(
          `player-invite-msg-${invite.id}`,
          gmContact,
          invite.updatedAt,
          `Hi ${playerContact.name?.split(" ")[0] ?? "there"}, I would love to have you at ${invite.gameName}. Let me know by ${formatDateTime(
            actionDue,
          )} if you can make it!`,
        ),
      ],
      actionItems: [
        buildActionItem(
          `player-invite-action-${invite.id}`,
          "Confirm participation",
          "player",
          actionDue,
        ),
      ],
    });
  });

  sessions.forEach((session) => {
    const gmContact = resolvePersonaContact(
      gmFallback,
      session.gmId
        ? {
            id: session.gmId,
            name: session.gmName ?? "Game master",
            email: session.gmEmail ?? null,
            persona: "gm",
          }
        : null,
    );
    const locationLabel = extractLocationLabel(session.location);
    const priority =
      session.gameDate.getTime() - Date.now() <= 48 * 60 * 60 * 1000 ? "high" : "medium";
    threads.push({
      id: `player-session-${session.id}`,
      subject: `${session.gameName} is scheduled`,
      personas: ["player", "gm", "ops"],
      categories: ["game-updates"],
      tags: [session.systemName ?? "System", locationLabel ?? "Online"],
      priority,
      status: "open",
      updatedAt: session.updatedAt.toISOString(),
      unreadFor: [],
      preview: `${session.participantCount} fellow players confirmed for ${formatDateTime(
        session.gameDate,
      )}.`,
      participants: [
        buildParticipant(playerContact, "Player"),
        buildParticipant(gmContact, "Game master"),
        buildParticipant(resolvePersonaContact(opsFallback, null), "Operations"),
      ],
      messages: [
        buildMessage(
          `player-session-msg-${session.id}`,
          gmContact,
          session.updatedAt,
          `Agenda, safety tools, and quick actions are pinned for ${formatDateTime(
            session.gameDate,
          )}.`,
        ),
      ],
      actionItems: [
        buildActionItem(
          `player-session-action-${session.id}`,
          "Review session brief",
          "player",
          new Date(session.gameDate.getTime() - 6 * 60 * 60 * 1000),
          "in-progress",
        ),
      ],
    });
  });

  registrations.forEach((registration) => {
    const organizerContact = registration.organizerId
      ? {
          id: registration.organizerId,
          name: registration.organizerName ?? "Organizer",
          email: registration.organizerEmail ?? null,
          persona: "ops" as const,
        }
      : opsFallback;
    const start = toDate(registration.startDate);
    const priority = registration.status === "pending" ? "medium" : "low";
    const status: SharedInboxThread["status"] =
      registration.status === "confirmed"
        ? "resolved"
        : registration.status === "pending"
          ? "waiting"
          : "open";
    threads.push({
      id: `player-event-${registration.id}`,
      subject: `Event registration: ${registration.eventName}`,
      personas: ["player", "ops", "admin"],
      categories: ["events"],
      tags: [registration.registrationType, registration.city ?? "Remote"],
      priority,
      status,
      updatedAt: registration.updatedAt.toISOString(),
      unreadFor: registration.status === "pending" ? ["player"] : [],
      preview: `Registration ${registration.status} • ${registration.city ?? "Location TBD"} • starts ${formatDateOnly(
        start,
      )}.`,
      participants: [
        buildParticipant(playerContact, "Player"),
        buildParticipant(organizerContact, "Operations"),
        buildParticipant(adminFallback, "Platform admin"),
      ],
      messages: [
        buildMessage(
          `player-event-msg-${registration.id}`,
          organizerContact,
          registration.updatedAt,
          `Thanks for registering for ${registration.eventName}. We'll notify you if logistics change before ${formatDateOnly(
            registration.startDate,
          )}.`,
        ),
      ],
      ...(registration.status === "pending"
        ? {
            actionItems: [
              buildActionItem(
                `player-event-action-${registration.id}`,
                "Complete payment",
                "player",
                start ? new Date(start.getTime() - 24 * 60 * 60 * 1000) : null,
              ),
            ],
          }
        : {}),
    });
  });

  const sortedThreads = sortThreads(threads);
  const unreadCount = sortedThreads.filter((thread) =>
    thread.unreadFor.includes("player"),
  ).length;
  const nextSession = sessions[0];
  const highlightDescription = nextSession
    ? `Prep for ${nextSession.gameName} on ${formatDateTime(
        nextSession.gameDate,
      )} and sync with your GM in advance.`
    : invites.length
      ? `Respond to open invites to lock your spot before ${formatDateTime(
          invites[0]!.gameDate,
        )}.`
      : "Everything's clear—watch for new invitations as they arrive.";

  return {
    config: {
      persona: "player",
      heading: "Player shared inbox",
      description: "Keep campaign updates, invites, and safety notes in one timeline.",
      supportingCopy:
        "Leo's workspace bridges GM prep with player commitments so responses stay timely across devices.",
      filters: [
        { id: "all", label: "All updates" },
        { id: "game-updates", label: "Game updates" },
        { id: "team-invitations", label: "Team invitations" },
        { id: "events", label: "Events & RSVPs" },
      ],
      highlight: {
        label: "Action needed",
        value: invites.length
          ? `${invites.length} invite${invites.length === 1 ? "" : "s"}`
          : "Stay ready",
        description: highlightDescription,
      },
      quickMetrics: [
        {
          id: "upcoming",
          label: "Upcoming sessions",
          value: `${sessions.length}`,
          ...(nextSession ? { delta: formatDateOnly(nextSession.gameDate) } : {}),
        },
        {
          id: "invites",
          label: "Pending invites",
          value: `${invites.length}`,
          ...(invites.length ? { delta: `${unreadCount} awaiting` } : {}),
        },
        {
          id: "events",
          label: "Event RSVPs",
          value: `${registrations.length}`,
        },
      ],
      collaborationTips: [
        invites.length
          ? "Reply directly from the thread to confirm or decline GM invitations."
          : "Keep notifications on—new invitations will land here for quick responses.",
        sessions.length
          ? "Use quick actions in each thread to review briefs and confirm safety tools."
          : "Bookmark campaigns you love; we'll surface new sessions the moment they publish.",
        registrations.length
          ? "Registrations automatically sync across ops and admin personas for smoother approvals."
          : "RSVP to public events from /events to unlock collaboration analytics here.",
      ],
    },
    threads: sortedThreads,
  } satisfies SharedInboxSnapshot;
}

async function buildOpsSnapshot(db: DbClient): Promise<SharedInboxSnapshot> {
  const events = await fetchOpsEvents(db);
  const adminContact = await findUserByRoleKeyword(db, "Admin", "admin");
  const gmContact = await findGmContact(db);
  const opsFallback = await findUserByRoleKeyword(db, "Ops", "ops");

  const now = new Date();
  const threads: SharedInboxThread[] = events.map((event) => {
    const startDate = toDate(event.startDate);
    const availableSpots = computeAvailableSpots(event);
    const daysUntilStart = startDate
      ? Math.ceil((startDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const priority: SharedInboxThread["priority"] =
      event.status === "draft" ||
      (availableSpots !== null && availableSpots <= 3) ||
      (daysUntilStart !== null && daysUntilStart <= 2)
        ? "high"
        : daysUntilStart !== null && daysUntilStart <= 7
          ? "medium"
          : "low";
    const category =
      event.status === "draft"
        ? "approvals"
        : daysUntilStart !== null && daysUntilStart <= 2
          ? "event-alerts"
          : availableSpots !== null && availableSpots <= 3
            ? "event-alerts"
            : event.status === "completed"
              ? "recaps"
              : "logistics";
    const status: SharedInboxThread["status"] =
      event.status === "completed"
        ? "resolved"
        : event.status === "draft"
          ? "open"
          : "waiting";
    const organizerContact: PersonaContact | null = event.organizerId
      ? {
          id: event.organizerId,
          name: event.organizerName ?? "Operations lead",
          email: event.organizerEmail ?? null,
          persona: "ops",
        }
      : opsFallback;
    const participants = [
      buildParticipant(organizerContact, "Operations"),
      buildParticipant(gmContact, "Game master"),
      buildParticipant(adminContact, "Platform admin"),
    ];
    const actionItems: SharedInboxThread["actionItems"] | undefined =
      status === "open"
        ? [
            buildActionItem(
              `ops-approve-${event.id}`,
              event.status === "draft"
                ? "Review and approve event"
                : "Confirm runbook readiness",
              "ops",
              startDate ? new Date(startDate.getTime() - 48 * 60 * 60 * 1000) : null,
            ),
          ]
        : status === "waiting" && availableSpots !== null && availableSpots <= 3
          ? [
              buildActionItem(
                `ops-boost-${event.id}`,
                "Boost marketing reach",
                "ops",
                startDate ? new Date(startDate.getTime() - 24 * 60 * 60 * 1000) : null,
                "in-progress",
              ),
            ]
          : undefined;

    const previewParts = [
      `${event.registrationCount} registration${event.registrationCount === 1 ? "" : "s"}`,
      availableSpots !== null
        ? `${availableSpots} spot${availableSpots === 1 ? "" : "s"} left`
        : null,
      event.city ? `${event.city}${event.country ? `, ${event.country}` : ""}` : null,
    ].filter(Boolean);

    return {
      id: `ops-event-${event.id}`,
      subject: event.name,
      personas: ["ops", "gm", "admin"],
      categories: [category],
      tags: previewParts.slice(0, 2) as string[],
      priority,
      status,
      updatedAt: event.updatedAt.toISOString(),
      unreadFor: priority === "high" ? ["ops"] : [],
      preview: previewParts.join(" • "),
      participants,
      messages: [
        buildMessage(
          `ops-event-msg-${event.id}`,
          organizerContact,
          event.updatedAt,
          `Status: ${event.status.replace(/_/g, " ")}. ${availableSpots !== null ? `${availableSpots} spots remaining.` : ""} Next milestone: ${
            startDate ? formatDateOnly(startDate) : "TBD"
          }.`,
        ),
      ],
      ...(actionItems ? { actionItems } : {}),
    } satisfies SharedInboxThread;
  });

  const approvals = events.filter((event) => event.status === "draft").length;
  const alerts = events.filter((event) => {
    const startDate = toDate(event.startDate);
    const availableSpots = computeAvailableSpots(event);
    const daysUntilStart = startDate
      ? Math.ceil((startDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    return (
      (daysUntilStart !== null && daysUntilStart <= 2) ||
      (availableSpots !== null &&
        availableSpots <= 3 &&
        event.status === "registration_open")
    );
  }).length;

  return {
    config: {
      persona: "ops",
      heading: "Operations shared inbox",
      description: "Unify vendor escalations, staffing check-ins, and approval loops.",
      supportingCopy:
        "Priya's team sees what needs attention first, with context for event readiness and guest safety.",
      filters: [
        { id: "all", label: "All threads" },
        { id: "event-alerts", label: "Event alerts" },
        { id: "approvals", label: "Approvals" },
        { id: "logistics", label: "Logistics" },
        { id: "recaps", label: "Recaps" },
      ],
      highlight: {
        label: "Day-of checklist",
        value: alerts
          ? `${alerts} alert${alerts === 1 ? "" : "s"}`
          : `${approvals} approvals`,
        description:
          alerts > 0
            ? "Confirm staffing and safety plans for high-priority events."
            : approvals > 0
              ? "Review draft events awaiting green light before scheduling."
              : "Monitor logistics updates as registrations roll in across the platform.",
      },
      quickMetrics: [
        {
          id: "alerts",
          label: "Live alerts",
          value: `${alerts}`,
          ...(alerts ? { delta: "Requires follow-up" } : {}),
        },
        {
          id: "approvals",
          label: "Pending approvals",
          value: `${approvals}`,
        },
        {
          id: "public",
          label: "Public events",
          value: `${events.filter((event) => event.isPublic).length}`,
        },
      ],
      collaborationTips: [
        "Attach logistics briefs so GMs and admins stay aligned on readiness.",
        "Use alerts to trigger marketing boosts when capacity dips below threshold.",
        "Escalate compliance questions directly to platform admin without leaving the thread.",
      ],
    },
    threads: sortThreads(threads),
  } satisfies SharedInboxSnapshot;
}

async function buildGmSnapshot(
  db: DbClient,
  contextUser: ContextUser | null,
): Promise<SharedInboxSnapshot> {
  if (!contextUser) {
    return {
      config: {
        persona: "gm",
        heading: "Game master shared inbox",
        description:
          "Track narrative tweaks, player reactions, and ops escalations in one place.",
        supportingCopy: "Authenticate as a GM to access pipeline and feedback threads.",
        filters: [
          { id: "all", label: "All threads" },
          { id: "narrative", label: "Narrative" },
          { id: "ops-sync", label: "Ops sync" },
          { id: "pipeline", label: "Pipeline" },
        ],
        highlight: {
          label: "Pipeline coverage",
          value: "Sign in",
          description: "Log in as a GM to load campaign health across personas.",
        },
        quickMetrics: [
          { id: "sessions", label: "Upcoming sessions", value: "—" },
          { id: "campaigns", label: "Active campaigns", value: "—" },
          { id: "feedback", label: "Player feedback", value: "—" },
        ],
        collaborationTips: [
          "Link your GM account to surface campaign briefs here.",
          "Once authenticated, you'll see ops escalations connected to your sessions.",
          "Feedback summaries sync automatically with admin personas.",
        ],
      },
      threads: [],
    } satisfies SharedInboxSnapshot;
  }

  const [campaignsList, gamesList] = await Promise.all([
    fetchGmCampaigns(db, contextUser.id),
    fetchGmGames(db, contextUser.id),
  ]);

  const gmContact: PersonaContact = {
    id: contextUser.id,
    name: contextUser.name ?? contextUser.email ?? "Game master",
    email: contextUser.email,
    persona: "gm",
  };
  const opsContact = await findUserByRoleKeyword(db, "Ops", "ops");
  const adminContact = await findUserByRoleKeyword(db, "Admin", "admin");
  const playerLeadContact =
    (await findUserByRoleKeyword(db, "Player", "player")) ??
    ({
      id: "player-lead",
      name: "Player lead",
      email: null,
      persona: "player",
    } satisfies PersonaContact);

  const threads: SharedInboxThread[] = [];

  campaignsList.forEach((campaign) => {
    const locationLabel = extractLocationLabel(campaign.location);
    const statusLabel = campaign.status.replace(/_/g, " ");
    threads.push({
      id: `gm-campaign-${campaign.id}`,
      subject: `Campaign: ${campaign.name}`,
      personas: ["gm", "ops", "admin"],
      categories: ["pipeline"],
      tags: [campaign.systemName ?? "System", `${campaign.participantCount} players`],
      priority: campaign.status === "completed" ? "low" : "medium",
      status: campaign.status === "completed" ? "resolved" : "open",
      updatedAt: campaign.updatedAt.toISOString(),
      unreadFor: campaign.status === "active" ? ["gm"] : [],
      preview: `${statusLabel} • ${campaign.recurrence} • ${campaign.timeOfDay}${
        locationLabel ? ` • ${locationLabel}` : ""
      }`,
      participants: [
        buildParticipant(gmContact, "Game master"),
        buildParticipant(opsContact, "Operations"),
        buildParticipant(adminContact, "Platform admin"),
      ],
      messages: [
        buildMessage(
          `gm-campaign-msg-${campaign.id}`,
          gmContact,
          campaign.updatedAt,
          `${campaign.participantCount} players confirmed. Session duration ${campaign.sessionDuration}h${
            campaign.pricePerSession
              ? ` • ${campaign.pricePerSession.toFixed(2)} per session`
              : ""
          }.`,
        ),
      ],
      actionItems: [
        buildActionItem(
          `gm-campaign-action-${campaign.id}`,
          "Share narrative brief",
          "gm",
          new Date(campaign.updatedAt.getTime() + 24 * 60 * 60 * 1000),
        ),
      ],
    });
  });

  gamesList.forEach((game) => {
    const locationLabel = extractLocationLabel(game.location);
    const priority: SharedInboxThread["priority"] =
      game.dateTime.getTime() - Date.now() <= 24 * 60 * 60 * 1000 ? "high" : "medium";
    threads.push({
      id: `gm-session-${game.id}`,
      subject: `Prep ${game.name}`,
      personas: ["gm", "ops", "player"],
      categories: ["narrative"],
      tags: [game.systemName ?? "System", `${game.participantCount} players`],
      priority,
      status: "open",
      updatedAt: game.updatedAt.toISOString(),
      unreadFor: priority === "high" ? ["gm"] : [],
      preview: `Runs ${formatDateTime(game.dateTime)}${
        locationLabel ? ` • ${locationLabel}` : ""
      }.`,
      participants: [
        buildParticipant(gmContact, "Game master"),
        buildParticipant(opsContact, "Operations"),
        buildParticipant(playerLeadContact, "Player lead"),
      ],
      messages: [
        buildMessage(
          `gm-session-msg-${game.id}`,
          gmContact,
          game.updatedAt,
          `Agenda locked. ${game.participantCount} players confirmed. Sync with ops for safety cues before go-time.`,
        ),
      ],
      actionItems: [
        buildActionItem(
          `gm-session-action-${game.id}`,
          "Send pre-session note",
          "gm",
          new Date(game.dateTime.getTime() - 6 * 60 * 60 * 1000),
          "in-progress",
        ),
      ],
    });
  });

  const quickTips = [
    gamesList.length
      ? "Confirm safety rituals with ops at least a day before each session."
      : "Schedule a session to activate cross-persona collaboration signals.",
    campaignsList.length
      ? "Use pipeline threads to align narrative beats with platform goals."
      : "Launch a campaign to unlock retention metrics in reporting.",
    "Share debrief notes here so admin personas can fold them into governance reviews.",
  ];

  return {
    config: {
      persona: "gm",
      heading: "Game master shared inbox",
      description:
        "Track narrative tweaks, player reactions, and ops escalations in one place.",
      supportingCopy:
        "Alex coordinates with ops and players while keeping campaign prep unblocked.",
      filters: [
        { id: "all", label: "All threads" },
        { id: "narrative", label: "Narrative" },
        { id: "ops-sync", label: "Ops sync" },
        { id: "pipeline", label: "Pipeline" },
      ],
      highlight: {
        label: "Pre-session focus",
        value: gamesList.length
          ? `Next up: ${formatDateTime(gamesList[0]!.dateTime)}`
          : "No sessions scheduled",
        description: gamesList.length
          ? "Review briefs, update notes, and confirm safety tools before players arrive."
          : "Schedule your next session to trigger automated readiness cues across personas.",
      },
      quickMetrics: [
        { id: "sessions", label: "Upcoming sessions", value: `${gamesList.length}` },
        { id: "campaigns", label: "Active campaigns", value: `${campaignsList.length}` },
        {
          id: "players",
          label: "Confirmed players",
          value: `${gamesList.reduce((acc, game) => acc + game.participantCount, 0)}`,
        },
      ],
      collaborationTips: quickTips,
    },
    threads: sortThreads(threads),
  } satisfies SharedInboxSnapshot;
}

async function buildAdminSnapshot(db: DbClient): Promise<SharedInboxSnapshot> {
  const [eventsList, roleAssignments, activeMemberships] = await Promise.all([
    fetchOpsEvents(db),
    fetchRecentRoleAssignments(db),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(memberships)
      .where(eq(memberships.status, "active"))
      .then((rows) => Number(rows[0]?.count ?? 0)),
  ]);

  const opsContact = await findUserByRoleKeyword(db, "Ops", "ops");
  const adminContact = await findUserByRoleKeyword(db, "Admin", "admin");
  const gmContact = await findGmContact(db);

  const complianceThreads: SharedInboxThread[] = eventsList
    .filter((event) => event.isPublic || event.status === "draft")
    .map((event) => {
      const startDate = toDate(event.startDate);
      const availableSpots = computeAvailableSpots(event);
      const previewParts = [
        `Status: ${event.status.replace(/_/g, " ")}`,
        event.isPublic ? "Public" : "Private",
        availableSpots !== null ? `${availableSpots} spots open` : null,
      ].filter(Boolean);
      return {
        id: `admin-event-${event.id}`,
        subject: `Compliance review • ${event.name}`,
        personas: ["admin", "ops"],
        categories: ["compliance"],
        tags: previewParts.slice(0, 2) as string[],
        priority: event.status === "draft" ? "high" : "medium",
        status: event.status === "draft" ? "open" : "waiting",
        updatedAt: event.updatedAt.toISOString(),
        unreadFor: event.status === "draft" ? ["admin"] : [],
        preview: previewParts.join(" • "),
        participants: [
          buildParticipant(adminContact, "Platform admin"),
          buildParticipant(opsContact, "Operations"),
        ],
        messages: [
          buildMessage(
            `admin-event-msg-${event.id}`,
            adminContact,
            event.updatedAt,
            `Run compliance checklist before ${
              startDate ? formatDateOnly(startDate) : "launch"
            }. Registration count: ${event.registrationCount}.`,
          ),
        ],
        actionItems: [
          buildActionItem(
            `admin-event-action-${event.id}`,
            "Audit data & approve",
            "admin",
            startDate ? new Date(startDate.getTime() - 72 * 60 * 60 * 1000) : null,
          ),
        ],
      } satisfies SharedInboxThread;
    });

  const roleThreads: SharedInboxThread[] = roleAssignments.map((assignment) => {
    const expiresIn = assignment.expiresAt
      ? formatDateOnly(assignment.expiresAt)
      : "No expiry";
    return {
      id: `admin-role-${assignment.id}`,
      subject: `Role change • ${assignment.userName ?? assignment.userEmail ?? "User"}`,
      personas: ["admin", "ops", "gm"],
      categories: ["roles"],
      tags: [assignment.roleName, expiresIn],
      priority:
        assignment.expiresAt &&
        assignment.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ? "high"
          : "low",
      status: "open",
      updatedAt: assignment.assignedAt.toISOString(),
      unreadFor: ["admin"],
      preview: `${assignment.roleName} assigned ${formatDateOnly(
        assignment.assignedAt,
      )}${assignment.notes ? ` • ${assignment.notes}` : ""}.`,
      participants: [
        buildParticipant(adminContact, "Platform admin"),
        buildParticipant(opsContact, "Operations"),
        buildParticipant(gmContact, "Game master"),
      ],
      messages: [
        buildMessage(
          `admin-role-msg-${assignment.id}`,
          adminContact,
          assignment.assignedAt,
          `Verify scope and permissions for ${assignment.roleName}. Expires: ${expiresIn}.`,
        ),
      ],
      actionItems: [
        buildActionItem(
          `admin-role-action-${assignment.id}`,
          "Confirm audit trail",
          "admin",
          assignment.expiresAt ??
            new Date(assignment.assignedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        ),
      ],
    } satisfies SharedInboxThread;
  });

  const threads = sortThreads([...complianceThreads, ...roleThreads]);
  const securityBacklog = roleThreads.filter(
    (thread) => thread.priority === "high",
  ).length;

  return {
    config: {
      persona: "admin",
      heading: "Platform admin shared inbox",
      description:
        "Centralize compliance escalations, billing follow-ups, and role requests.",
      supportingCopy:
        "Jordan keeps governance loops visible while empowering ops and GM teammates to self-serve.",
      filters: [
        { id: "all", label: "All conversations" },
        { id: "compliance", label: "Compliance" },
        { id: "roles", label: "Role requests" },
        { id: "security", label: "Security" },
      ],
      highlight: {
        label: "Escalations",
        value: threads.length
          ? `${threads.length} item${threads.length === 1 ? "" : "s"}`
          : "All clear",
        description: threads.length
          ? "Review compliance-sensitive events and confirm role scopes."
          : "No outstanding escalations. Monitor ops alerts for new items.",
      },
      quickMetrics: [
        {
          id: "memberships",
          label: "Active memberships",
          value: `${activeMemberships}`,
        },
        {
          id: "compliance",
          label: "Compliance reviews",
          value: `${complianceThreads.length}`,
        },
        {
          id: "security",
          label: "Security follow-ups",
          value: `${securityBacklog}`,
          ...(securityBacklog ? { delta: "Needs action" } : {}),
        },
      ],
      collaborationTips: [
        "Attach compliance notes so ops and GMs can resolve escalations quickly.",
        "Coordinate with finance on billing threads directly from this workspace.",
        "Use role threads to verify least-privilege access after org changes.",
      ],
    },
    threads,
  } satisfies SharedInboxSnapshot;
}

export const getSharedInboxSnapshot = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      persona: personaSchema,
      userId: z.string().nullish(),
    }).parse,
  )
  .handler(async ({ data }): Promise<OperationResult<SharedInboxSnapshot>> => {
    try {
      const db = await getDb();
      switch (data.persona) {
        case "player": {
          const contextUser = await fetchContextUser(db, data.userId);
          const snapshot = await buildPlayerSnapshot(db, contextUser);
          return { success: true, data: snapshot };
        }
        case "ops": {
          const snapshot = await buildOpsSnapshot(db);
          return { success: true, data: snapshot };
        }
        case "gm": {
          const contextUser = await fetchContextUser(db, data.userId);
          const snapshot = await buildGmSnapshot(db, contextUser);
          return { success: true, data: snapshot };
        }
        case "admin": {
          const snapshot = await buildAdminSnapshot(db);
          return { success: true, data: snapshot };
        }
        default:
          return {
            success: false,
            errors: [{ code: "BAD_REQUEST", message: "Unsupported persona" }],
          };
      }
    } catch (error) {
      console.error("Failed to load shared inbox snapshot", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to load shared inbox" }],
      };
    }
  });
