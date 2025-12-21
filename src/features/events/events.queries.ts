import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { EventRegistration } from "~/db/schema";
import { eventRegistrations, events, teams, user } from "~/db/schema";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { forbidden } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventPaymentMetadata,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";
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
import { castRegistrationJsonbFields, type EventRegistrationWithRoster } from "./utils";

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
  .inputValidator(zod$(listEventsSchema))
  .handler(async ({ data }): Promise<EventListResult> => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const filters = data.filters || {};
    const page = Math.max(1, data.page || 1);
    const pageSize = Math.min(100, Math.max(1, data.pageSize || 20));
    const offset = (page - 1) * pageSize;
    const sortBy = data.sortBy || "startDate";
    const sortOrder = data.sortOrder || "asc";

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      conditions.push(
        inArray(events.status, statuses as (typeof events.status._.data)[]),
      );
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      conditions.push(inArray(events.type, types as (typeof events.type._.data)[]));
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

    if (filters.province) {
      conditions.push(eq(events.province, filters.province));
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
      ({ event, organizer, registrationCount }) => {
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
          rules: (event.rules as EventRules) || {},
          schedule: (event.schedule as EventSchedule) || {},
          divisions: (event.divisions as EventDivisions) || {},
          amenities: (event.amenities as EventAmenities) || {},
          requirements: (event.requirements as EventRequirements) || {},
          metadata: (event.metadata as EventMetadata) || {},
          organizer: organizer!,
          registrationCount,
          isRegistrationOpen,
          availableSpots,
        };
      },
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
  .inputValidator(zod$(getEventSchema))
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
        success: true,
        data: {
          ...event,
          rules: (event.rules as EventRules) || {},
          schedule: (event.schedule as EventSchedule) || {},
          divisions: (event.divisions as EventDivisions) || {},
          amenities: (event.amenities as EventAmenities) || {},
          requirements: (event.requirements as EventRequirements) || {},
          metadata: (event.metadata as EventMetadata) || {},
          organizer: organizer!,
          registrationCount,
          isRegistrationOpen,
          availableSpots,
        },
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
 * Get upcoming events for the dashboard
 */
export const getUpcomingEvents = createServerFn({ method: "GET" })
  .inputValidator(zod$(getUpcomingEventsSchema))
  .handler(async ({ data }): Promise<EventWithDetails[]> => {
    const limit = Math.min(10, data.limit || 3);

    const result = (await listEvents({
      data: {
        filters: {
          status: ["published", "registration_open"],
          startDateFrom: new Date(),
        },
        pageSize: limit,
        sortBy: "startDate",
        sortOrder: "asc",
      },
    })) as EventListResult;

    return result.events;
  });

/**
 * Get all registrations for an event (organizer or admin only)
 * Returns user emails and payment data - must be protected
 */
export const getEventRegistrations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(z.object({ eventId: z.uuid() }).parse)
  .handler(async ({ data, context }): Promise<EventRegistrationSummary[]> => {
    const authUser = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const db = await getDb();

    // Check if user is organizer or admin
    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) {
      throw forbidden("Event not found");
    }

    const userIsAdmin = await isAdmin(authUser.id);
    if (event.organizerId !== authUser.id && !userIsAdmin) {
      throw forbidden("Only event organizers or admins can view registrations");
    }

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
  .inputValidator(zod$(checkEventRegistrationSchema))
  .handler(
    async ({
      data,
    }): Promise<{
      isRegistered: boolean;
      registration?: EventRegistrationWithRoster;
    }> => {
      // Get user from session - not from client input
      const { getRequest } = await import("@tanstack/react-start/server");
      const { getAuth } = await import("~/lib/auth/server-helpers");
      const auth = await getAuth();
      const { headers } = getRequest();
      const session = await auth.api.getSession({ headers });
      const userId = session?.user?.id;

      if (!userId && !data.teamId) {
        return { isRegistered: false };
      }

      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const conditions: ReturnType<typeof eq>[] = [
        eq(eventRegistrations.eventId, data.eventId),
        eq(eventRegistrations.status, "confirmed"),
      ];

      if (userId) {
        conditions.push(eq(eventRegistrations.userId, userId));
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
    },
  );
