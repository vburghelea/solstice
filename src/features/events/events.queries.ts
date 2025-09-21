import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { EventRegistration } from "~/db/schema";
import { eventRegistrations, events, teams, user } from "~/db/schema";
import { zod$ } from "~/lib/server/fn-utils";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventPaymentMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";

// Lightweight DTO for registrations list
export type EventRegistrationListItem = {
  id: string;
  registrationType: string;
  status: string;
  division: string | null;
  team: { id: string; name: string; slug: string } | null;
  user: { id: string; name: string; email: string };
};
import {
  checkEventRegistrationSchema,
  getEventSchema,
  getUpcomingEventsSchema,
  listEventsSchema,
} from "./events.schemas";
import type {
  EventListResult,
  EventOperationResult,
  EventPaymentMethod,
  EventPaymentStatus,
  EventWithDetails,
} from "./events.types";

// Type for EventRegistration with properly typed roster + metadata
type EventRegistrationWithRoster = Omit<
  EventRegistration,
  "roster" | "paymentMetadata"
> & {
  roster: EventRegistrationRoster;
  paymentMetadata: EventPaymentMetadata | null;
};

// Helper to cast registration jsonb fields
function castRegistrationJsonbFields(
  registration: EventRegistration,
): EventRegistrationWithRoster {
  return {
    ...registration,
    roster: (registration.roster || {}) as EventRegistrationRoster,
    paymentMetadata: registration.paymentMetadata
      ? (registration.paymentMetadata as EventPaymentMetadata)
      : null,
  };
}

// Helper to cast event jsonb fields and add derived properties
function castEventJsonbFields(
  event: typeof events.$inferSelect,
  organizer: { id: string; name: string; email: string } | null,
  registrationCount: number,
): EventWithDetails {
  const now = new Date();
  const registrationOpens = event.registrationOpensAt
    ? new Date(event.registrationOpensAt)
    : null;
  const registrationCloses = event.registrationClosesAt
    ? new Date(event.registrationClosesAt)
    : null;

  const isRegistrationOpen =
    event.status === "registration_open" &&
    (!registrationOpens || now >= registrationOpens) &&
    (!registrationCloses || now <= registrationCloses);

  let availableSpots: number | undefined;
  if (event.registrationType === "team" && event.maxTeams) {
    availableSpots = Math.max(0, event.maxTeams - registrationCount);
  } else if (event.registrationType === "individual" && event.maxParticipants) {
    availableSpots = Math.max(0, event.maxParticipants - registrationCount);
  }

  return {
    ...event,
    rules: (event.rules || {}) as EventRules,
    schedule: (event.schedule || {}) as EventSchedule,
    divisions: (event.divisions || {}) as EventDivisions,
    amenities: (event.amenities || {}) as EventAmenities,
    requirements: (event.requirements || {}) as EventRequirements,
    metadata: (event.metadata || {}) as EventMetadata,
    organizer: organizer!,
    registrationCount,
    isRegistrationOpen,
    availableSpots,
  };
}
export type EventRegistrationSummary = {
  id: string;
  userId: string | null;
  teamId: string | null;
  eventId: string;
  registrationType: EventRegistration["registrationType"];
  status: EventRegistration["status"];
  paymentStatus: EventPaymentStatus;
  paymentMethod: EventPaymentMethod;
  paymentId: string | null;
  amountDueCents: number;
  amountPaidCents: number | null;
  paymentCompletedAt: Date | null;
  paymentMetadata: EventPaymentMetadata | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
  teamName: string | null;
};

/**
 * List events with filters and pagination
 */
export const listEvents = createServerFn({ method: "GET" })
  .validator(zod$(listEventsSchema))
  .handler(async ({ data }): Promise<EventListResult> => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const filters = data?.filters || {};
    const page = Math.max(1, data?.page || 1);
    const pageSize = Math.min(100, Math.max(1, data?.pageSize || 20));
    const offset = (page - 1) * pageSize;
    const sortBy = data?.sortBy || "startDate";
    const sortOrder = data?.sortOrder || "asc";

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.publicOnly !== false) {
      conditions.push(eq(events.isPublic, true));
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      conditions.push(inArray(events.status, statuses));
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      conditions.push(inArray(events.type, types));
    }

    if (filters.organizerId) {
      conditions.push(eq(events.organizerId, filters.organizerId));
    }

    if (filters.startDateFrom) {
      conditions.push(
        gte(events.startDate, filters.startDateFrom.toISOString().split("T")[0]),
      );
    }

    if (filters.startDateTo) {
      conditions.push(
        lte(events.startDate, filters.startDateTo.toISOString().split("T")[0]),
      );
    }

    if (filters.city) {
      conditions.push(eq(events.city, filters.city));
    }

    if (filters.country) {
      conditions.push(eq(events.country, filters.country));
    }

    if (filters.featured === true) {
      conditions.push(eq(events.isFeatured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(whereClause);

    // Get events with details
    const orderByColumn =
      sortBy === "name"
        ? events.name
        : sortBy === "createdAt"
          ? events.createdAt
          : events.startDate;

    const eventsList = await db
      .select({
        event: events,
        organizer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        registrationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${eventRegistrations} 
          WHERE ${eventRegistrations.eventId} = ${events.id}
          AND ${eventRegistrations.status} != 'canceled'
        )`,
      })
      .from(events)
      .leftJoin(user, eq(events.organizerId, user.id))
      .where(whereClause)
      .orderBy(sortOrder === "desc" ? desc(orderByColumn) : asc(orderByColumn))
      .limit(pageSize)
      .offset(offset);

    // Transform results
    const eventsWithDetails: EventWithDetails[] = eventsList.map(
      ({ event, organizer, registrationCount }) =>
        castEventJsonbFields(event, organizer, registrationCount),
    );

    const totalPages = Math.ceil(count / pageSize);

    return {
      events: eventsWithDetails,
      totalCount: count,
      pageInfo: {
        currentPage: page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  });

/**
 * Get a single event by ID or slug
 */
export const getEvent = createServerFn({ method: "GET" })
  .validator(zod$(getEventSchema))
  .handler(async ({ data }): Promise<EventOperationResult<EventWithDetails>> => {
    try {
      if (!data.id && !data.slug) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Either id or slug must be provided",
            },
          ],
        };
      }

      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const condition = data.id ? eq(events.id, data.id) : eq(events.slug, data.slug!);

      const result = await db
        .select({
          event: events,
          organizer: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          registrationCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${eventRegistrations} 
            WHERE ${eventRegistrations.eventId} = ${events.id}
            AND ${eventRegistrations.status} != 'canceled'
          )`,
        })
        .from(events)
        .leftJoin(user, eq(events.organizerId, user.id))
        .where(condition)
        .limit(1);

      if (result.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Event not found",
            },
          ],
        };
      }

      const { event, organizer, registrationCount } = result[0];

      return {
        success: true,
        data: castEventJsonbFields(event, organizer!, registrationCount),
      };
    } catch (error) {
      console.error("Error fetching event:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch event",
          },
        ],
      };
    }
  });

/**
 * List registrations for an event (organizers only)
 */
export const listEventRegistrations = createServerFn({ method: "GET" })
  .validator((data: unknown) => data as { eventId: string })
  .handler(async ({ data }) => {
    try {
      const [{ getDb }, { getAuth }, { PermissionService }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
        import("~/features/roles/permission.server"),
      ]);

      const db = await getDb();
      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false as const,
          errors: [{ code: "UNAUTHORIZED", message: "Not signed in" }],
        };
      }

      // Organizer or permitted role only
      const canManage = await PermissionService.canManageEvent(
        session.user.id,
        data.eventId,
      );
      if (!canManage) {
        // Also allow event organizerId
        const [ev] = await db
          .select()
          .from(events)
          .where(eq(events.id, data.eventId))
          .limit(1);
        if (!ev || ev.organizerId !== session.user.id) {
          return {
            success: false as const,
            errors: [{ code: "FORBIDDEN", message: "Insufficient permissions" }],
          };
        }
      }

      const rows = await db
        .select({
          registration: eventRegistrations,
          user: { id: user.id, name: user.name, email: user.email },
          team: teams,
          event: events,
        })
        .from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .innerJoin(user, eq(eventRegistrations.userId, user.id))
        .leftJoin(teams, eq(eventRegistrations.teamId, teams.id))
        .where(eq(eventRegistrations.eventId, data.eventId))
        .orderBy(desc(eventRegistrations.createdAt));

      const result: EventRegistrationListItem[] = rows.map((r) => ({
        id: r.registration.id,
        registrationType: r.registration.registrationType,
        status: r.registration.status,
        division: r.registration.division,
        team: r.team ? { id: r.team.id, name: r.team.name, slug: r.team.slug } : null,
        user: { id: r.user.id, name: r.user.name, email: r.user.email },
      }));

      return { success: true as const, data: result };
    } catch (error) {
      console.error("Error listing registrations:", error);
      return {
        success: false as const,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list registrations" }],
      };
    }
  });

/**
 * Get upcoming events (public endpoint for homepage)
 */
export const getUpcomingEvents = createServerFn({ method: "GET" })
  .validator(zod$(getUpcomingEventsSchema))
  .handler(async ({ data }): Promise<EventWithDetails[]> => {
    const limit = Math.min(10, data.limit || 3);

    const result = (await listEvents({
      data: {
        filters: {
          status: ["published", "registration_open"],
          publicOnly: true,
          startDateFrom: new Date(),
        },
        pageSize: limit,
        sortBy: "startDate",
        sortOrder: "asc",
      },
    })) as EventListResult;

    return (result as EventListResult).events;
  });

/**
 * Get all registrations for an event (organizer only)
 */
export const getEventRegistrations = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }).parse)
  .handler(async ({ data }): Promise<EventRegistrationSummary[]> => {
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const registrations = await db
      .select({
        id: eventRegistrations.id,
        userId: eventRegistrations.userId,
        teamId: eventRegistrations.teamId,
        eventId: eventRegistrations.eventId,
        registrationType: eventRegistrations.registrationType,
        status: eventRegistrations.status,
        paymentStatus: eventRegistrations.paymentStatus,
        paymentMethod: eventRegistrations.paymentMethod,
        paymentId: eventRegistrations.paymentId,
        amountDueCents: eventRegistrations.amountDueCents,
        amountPaidCents: eventRegistrations.amountPaidCents,
        paymentCompletedAt: eventRegistrations.paymentCompletedAt,
        paymentMetadata: eventRegistrations.paymentMetadata,
        createdAt: eventRegistrations.createdAt,
        userName: user.name,
        userEmail: user.email,
        teamName: teams.name,
      })
      .from(eventRegistrations)
      .leftJoin(user, eq(eventRegistrations.userId, user.id))
      .leftJoin(teams, eq(eventRegistrations.teamId, teams.id))
      .where(eq(eventRegistrations.eventId, data.eventId))
      .orderBy(desc(eventRegistrations.createdAt));

    return registrations.map((registration) => ({
      ...registration,
      userName: registration.userName ?? null,
      userEmail: registration.userEmail ?? null,
      teamName: registration.teamName ?? null,
      paymentMetadata: registration.paymentMetadata
        ? (registration.paymentMetadata as EventPaymentMetadata)
        : null,
    }));
  });

/**
 * Check if a user is registered for an event
 */
export const checkEventRegistration = createServerFn({ method: "GET" })
  .validator(zod$(checkEventRegistrationSchema))
  .handler(
    async ({
      data,
    }): Promise<{
      isRegistered: boolean;
      registration?: EventRegistrationWithRoster;
    }> => {
      if (!data.userId && !data.teamId) {
        return { isRegistered: false };
      }

    if (!data.userId && !data.teamId) {
      return { isRegistered: false };
    }

    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const conditions: ReturnType<typeof eq>[] = [
      eq(eventRegistrations.eventId, data.eventId),
      eq(eventRegistrations.status, "confirmed"),
    ];

    if (data.userId) {
      conditions.push(eq(eventRegistrations.userId, data.userId));
    }

    if (data.teamId) {
      conditions.push(eq(eventRegistrations.teamId, data.teamId));
    }

    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(...conditions))
      .limit(1);

    if (!registration) {
      return { isRegistered: false };
    }

    return {
      isRegistered: true,
      registration: castRegistrationJsonbFields(registration),
    };
  });
