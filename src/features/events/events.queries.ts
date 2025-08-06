import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { EventRegistration } from "~/db/schema";
import { eventRegistrations, events, user } from "~/db/schema";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";
import type { EventFilters, EventListResult, EventWithDetails } from "./events.types";

// Type for EventRegistration with properly typed roster
type EventRegistrationWithRoster = Omit<EventRegistration, "roster"> & {
  roster: EventRegistrationRoster;
};

// Helper to cast registration jsonb fields
function castRegistrationJsonbFields(
  registration: EventRegistration,
): EventRegistrationWithRoster {
  return {
    ...registration,
    roster: (registration.roster || {}) as EventRegistrationRoster,
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

/**
 * List events with filters and pagination
 */
export const listEvents = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    // Explicitly define the expected data structure for validation and type inference
    const validatedData = data as {
      filters?: EventFilters;
      page?: number;
      pageSize?: number;
      sortBy?: "startDate" | "createdAt" | "name";
      sortOrder?: "asc" | "desc";
    };
    return validatedData;
  })
  .handler(async ({ data = {} }): Promise<EventListResult> => {
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
          AND ${eventRegistrations.status} != 'cancelled'
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
  .validator((data: unknown) => {
    const validatedData = data as { id?: string; slug?: string };
    return validatedData;
  })
  .handler(async ({ data }) => {
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
            AND ${eventRegistrations.status} != 'cancelled'
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
 * Get upcoming events (public endpoint for homepage)
 */
export const getUpcomingEvents = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const validatedData = data as { limit?: number };
    return validatedData;
  })
  .handler(async ({ data }) => {
    const limit = Math.min(10, data?.limit || 3);

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
 * Check if a user is registered for an event
 */
export const checkEventRegistration = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const validatedData = data as { eventId?: string; userId?: string; teamId?: string };
    return validatedData;
  })
  .handler(async ({ data }) => {
    if (!data.eventId) {
      // Added check for eventId
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
