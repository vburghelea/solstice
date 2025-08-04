import { z } from "zod";
import { createEventInputSchema } from "~/db/schema/events.schema";

// Query schemas
export const listEventsSchema = z
  .object({
    filters: z
      .object({
        status: z.union([z.string(), z.array(z.string())]).optional(),
        type: z.union([z.string(), z.array(z.string())]).optional(),
        organizerId: z.string().optional(),
        startDateFrom: z.date().optional(),
        startDateTo: z.date().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        featured: z.boolean().optional(),
        publicOnly: z.boolean().optional(),
      })
      .optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    sortBy: z.enum(["startDate", "createdAt", "name"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .optional()
  .default({});
export type ListEventsInput = z.infer<typeof listEventsSchema>;

export const getEventSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
});
export type GetEventInput = z.infer<typeof getEventSchema>;

export const getUpcomingEventsSchema = z
  .object({
    limit: z.number().int().positive().max(10).optional(),
  })
  .optional()
  .default({});
export type GetUpcomingEventsInput = z.infer<typeof getUpcomingEventsSchema>;

export const checkEventRegistrationSchema = z.object({
  eventId: z.string(),
  userId: z.string().optional(),
  teamId: z.string().optional(),
});
export type CheckEventRegistrationInput = z.infer<typeof checkEventRegistrationSchema>;

// Mutation schemas
export const createEventSchema = createEventInputSchema;
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  eventId: z.string(),
  data: createEventInputSchema.partial().extend({
    status: z
      .enum([
        "draft",
        "published",
        "registration_open",
        "registration_closed",
        "in_progress",
        "completed",
        "cancelled",
      ])
      .optional(),
  }),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const registerForEventSchema = z.object({
  eventId: z.string(),
  teamId: z.string().optional(),
  division: z.string().optional(),
  notes: z.string().optional(),
  roster: z
    .array(
      z.object({
        userId: z.string(),
        role: z.string(),
      }),
    )
    .optional(),
});
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;

export const cancelEventRegistrationSchema = z.object({
  registrationId: z.string(),
  reason: z.string().optional(),
});
export type CancelEventRegistrationInput = z.infer<typeof cancelEventRegistrationSchema>;
