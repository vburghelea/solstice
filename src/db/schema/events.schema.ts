import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth.schema";
import { teams } from "./teams.schema";

/**
 * Event status enum
 */
export const eventStatusEnum = pgEnum("event_status", [
  "draft", // Event is being planned, not visible to public
  "published", // Event is visible but registration not open
  "registration_open", // Teams can register
  "registration_closed", // No more registrations
  "in_progress", // Event is currently happening
  "completed", // Event finished
  "canceled", // Event was canceled
]);

/**
 * Event type enum
 */
export const eventTypeEnum = pgEnum("event_type", [
  "tournament", // Competitive tournament
  "league", // League play
  "camp", // Training camp
  "clinic", // Skills clinic
  "social", // Social/fun event
  "other", // Other type
]);

/**
 * Registration type enum
 */
export const registrationTypeEnum = pgEnum("registration_type", [
  "team", // Teams register together
  "individual", // Individuals register and are assigned to teams
  "both", // Supports both team and individual registration
]);

/**
 * Main events table
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Basic information
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }), // For cards/previews

  // Event details
  type: eventTypeEnum("type").notNull().default("tournament"),
  status: eventStatusEnum("status").notNull().default("draft"),

  // Location
  venueName: varchar("venue_name", { length: 255 }),
  venueAddress: text("venue_address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 50 }),
  postalCode: varchar("postal_code", { length: 10 }),
  locationNotes: text("location_notes"), // Parking info, directions, etc.

  // Dates and times
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  registrationOpensAt: timestamp("registration_opens_at"),
  registrationClosesAt: timestamp("registration_closes_at"),

  // Registration settings
  registrationType: registrationTypeEnum("registration_type").notNull().default("team"),
  maxTeams: integer("max_teams"),
  maxParticipants: integer("max_participants"),
  minPlayersPerTeam: integer("min_players_per_team").default(7),
  maxPlayersPerTeam: integer("max_players_per_team").default(21),

  // Pricing (in cents)
  teamRegistrationFee: integer("team_registration_fee").default(0),
  individualRegistrationFee: integer("individual_registration_fee").default(0),
  earlyBirdDiscount: integer("early_bird_discount").default(0), // Percentage
  earlyBirdDeadline: timestamp("early_bird_deadline"),

  // Contact information
  organizerId: text("organizer_id")
    .notNull()
    .references(() => user.id),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),

  // Additional data
  rules: jsonb("rules"), // Custom rules/modifications
  schedule: jsonb("schedule"), // Detailed schedule info
  divisions: jsonb("divisions"), // e.g. [{name: "Competitive", maxTeams: 8}, {name: "Recreational", maxTeams: 12}]
  amenities: jsonb("amenities"), // ["parking", "concessions", "livestream", etc.]
  requirements: jsonb("requirements"), // ["valid membership", "insurance", etc.]

  // Media
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),

  // Visibility
  isPublic: boolean("is_public").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),

  // Metadata
  metadata: jsonb("metadata"), // Flexible field for additional data
});

/**
 * Event registrations table - tracks team/individual registrations for events
 */
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // References
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  teamId: text("team_id").references(() => teams.id), // Null for individual registrations
  userId: text("user_id")
    .notNull()
    .references(() => user.id), // Who registered

  // Registration details
  registrationType: registrationTypeEnum("registration_type").notNull(),
  division: varchar("division", { length: 100 }), // Which division they're in

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, waitlisted, canceled
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"), // pending, paid, refunded
  paymentId: text("payment_id"), // Reference to payment record

  // Team roster (for team registrations)
  roster: jsonb("roster"), // Array of player IDs and roles

  // Notes
  notes: text("notes"), // Any special requirements/notes
  internalNotes: text("internal_notes"), // Admin notes

  // Timestamps
  confirmedAt: timestamp("confirmed_at"),
  canceledAt: timestamp("canceled_at"),
});

/**
 * Event announcements/updates
 */
export const eventAnnouncements = pgTable("event_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),

  isPinned: boolean("is_pinned").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),

  // Who should see this
  visibility: varchar("visibility", { length: 50 }).notNull().default("all"), // all, registered, organizers
});

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(user, {
    fields: [events.organizerId],
    references: [user.id],
  }),
  registrations: many(eventRegistrations),
  announcements: many(eventAnnouncements),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [eventRegistrations.teamId],
    references: [teams.id],
  }),
  user: one(user, {
    fields: [eventRegistrations.userId],
    references: [user.id],
  }),
}));

export const eventAnnouncementsRelations = relations(eventAnnouncements, ({ one }) => ({
  event: one(events, {
    fields: [eventAnnouncements.eventId],
    references: [events.id],
  }),
  author: one(user, {
    fields: [eventAnnouncements.authorId],
    references: [user.id],
  }),
}));

// Zod schemas
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations);
export const selectEventRegistrationSchema = createSelectSchema(eventRegistrations);
export const insertEventAnnouncementSchema = createInsertSchema(eventAnnouncements);
export const selectEventAnnouncementSchema = createSelectSchema(eventAnnouncements);

// Custom validation schemas
export const createEventInputSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(["tournament", "league", "camp", "clinic", "social", "other"]),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  startDate: z.string(), // Will be converted to Date
  endDate: z.string(), // Will be converted to Date
  registrationType: z.enum(["team", "individual", "both"]),
  maxTeams: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  teamRegistrationFee: z.number().int().min(0).optional(),
  individualRegistrationFee: z.number().int().min(0).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type EventAnnouncement = typeof eventAnnouncements.$inferSelect;
export type NewEventAnnouncement = typeof eventAnnouncements.$inferInsert;
