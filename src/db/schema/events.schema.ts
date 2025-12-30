import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth.schema";
import { membershipTypes, memberships } from "./membership.schema";
import { teams } from "./teams.schema";

/**
 * Event status enum
 */
export const eventStatusEnum = pgEnum("event_status", [
  "draft", // Event is being planned, not visible in listings
  "published", // Event is visible but registration not open
  "registration_open", // Teams can register
  "registration_closed", // No more registrations
  "in_progress", // Event is currently happening
  "completed", // Event finished
  "cancelled", // Event was cancelled
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

export const registrationGroupTypeEnum = pgEnum("registration_group_type", [
  "individual",
  "pair",
  "team",
  "relay",
  "family",
]);

export const registrationGroupStatusEnum = pgEnum("registration_group_status", [
  "draft",
  "pending",
  "confirmed",
  "cancelled",
]);

export const registrationGroupMemberStatusEnum = pgEnum(
  "registration_group_member_status",
  ["invited", "pending", "active", "declined", "removed"],
);

export const registrationGroupMemberRoleEnum = pgEnum("registration_group_member_role", [
  "captain",
  "member",
]);

export const registrationInviteStatusEnum = pgEnum("registration_invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const checkoutSessionStatusEnum = pgEnum("checkout_session_status", [
  "pending",
  "completed",
  "cancelled",
  "failed",
  "refunded",
  "expired",
]);

export const checkoutItemTypeEnum = pgEnum("checkout_item_type", [
  "event_registration",
  "membership_purchase",
  "addon",
]);

export const checkoutProviderEnum = pgEnum("checkout_provider", ["square", "etransfer"]);

export const membershipPurchaseStatusEnum = pgEnum("membership_purchase_status", [
  "pending",
  "active",
  "expired",
  "cancelled",
  "refunded",
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
  province: varchar("province", { length: 50 }),
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
  minPlayersPerPair: integer("min_players_per_pair").default(2),
  maxPlayersPerPair: integer("max_players_per_pair").default(2),
  minPlayersPerRelay: integer("min_players_per_relay"),
  maxPlayersPerRelay: integer("max_players_per_relay"),
  allowWaitlist: boolean("allow_waitlist").notNull().default(false),
  requireMembership: boolean("require_membership").notNull().default(false),

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

  // Metadata
  metadata: jsonb("metadata"), // Flexible field for additional data
  allowEtransfer: boolean("allow_etransfer").notNull().default(false),
  etransferInstructions: text("etransfer_instructions"),
  etransferRecipient: varchar("etransfer_recipient", { length: 255 }),
});

export const registrationGroups = pgTable(
  "registration_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    groupType: registrationGroupTypeEnum("group_type").notNull(),
    status: registrationGroupStatusEnum("status").notNull().default("draft"),
    captainUserId: text("captain_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => teams.id),
    minSize: integer("min_size"),
    maxSize: integer("max_size"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("registration_groups_event_idx").on(table.eventId),
    index("registration_groups_captain_idx").on(table.captainUserId),
    index("registration_groups_team_idx").on(table.teamId),
  ],
);

export const registrationGroupMembers = pgTable(
  "registration_group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => registrationGroups.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }),
    role: registrationGroupMemberRoleEnum("role").notNull().default("member"),
    status: registrationGroupMemberStatusEnum("status").notNull().default("pending"),
    rosterMetadata: jsonb("roster_metadata").$type<Record<string, unknown>>(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id),
    invitedAt: timestamp("invited_at"),
    joinedAt: timestamp("joined_at"),
  },
  (table) => [
    index("registration_group_members_group_idx").on(table.groupId),
    index("registration_group_members_user_idx").on(table.userId),
    uniqueIndex("registration_group_members_group_user_idx").on(
      table.groupId,
      table.userId,
    ),
    uniqueIndex("registration_group_members_group_email_idx").on(
      table.groupId,
      table.email,
    ),
  ],
);

export const registrationInvites = pgTable(
  "registration_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => registrationGroups.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    status: registrationInviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at"),
    acceptedByUserId: text("accepted_by_user_id").references(() => user.id),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => [
    index("registration_invites_group_idx").on(table.groupId),
    uniqueIndex("registration_invites_token_idx").on(table.tokenHash),
  ],
);

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
  registrationGroupId: uuid("registration_group_id").references(
    () => registrationGroups.id,
  ),
  teamId: text("team_id").references(() => teams.id), // Null for individual registrations
  userId: text("user_id")
    .notNull()
    .references(() => user.id), // Who registered

  // Registration details
  registrationType: registrationTypeEnum("registration_type").notNull(),
  division: varchar("division", { length: 100 }), // Which division they're in

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, waitlisted, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"), // pending, paid, refunded
  paymentId: text("payment_id"), // Reference to payment record
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("square"),
  amountDueCents: integer("amount_due_cents").notNull().default(0),
  amountPaidCents: integer("amount_paid_cents"),
  paymentCompletedAt: timestamp("payment_completed_at"),
  paymentMetadata: jsonb("payment_metadata"),

  // Team roster (for team registrations)
  roster: jsonb("roster"), // Array of player IDs and roles

  // Notes
  notes: text("notes"), // Any special requirements/notes
  internalNotes: text("internal_notes"), // Admin notes

  // Timestamps
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export const membershipPurchases = pgTable(
  "membership_purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    membershipTypeId: varchar("membership_type_id", { length: 255 })
      .notNull()
      .references(() => membershipTypes.id),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    registrationGroupMemberId: uuid("registration_group_member_id").references(
      () => registrationGroupMembers.id,
      { onDelete: "set null" },
    ),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: membershipPurchaseStatusEnum("status").notNull().default("active"),
    paymentProvider: varchar("payment_provider", { length: 100 }),
    paymentId: varchar("payment_id", { length: 255 }),
    membershipId: varchar("membership_id", { length: 255 }).references(
      () => memberships.id,
    ),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("membership_purchases_type_idx").on(table.membershipTypeId),
    index("membership_purchases_user_idx").on(table.userId),
    index("membership_purchases_event_idx").on(table.eventId),
    index("membership_purchases_membership_idx").on(table.membershipId),
    index("membership_purchases_payment_idx").on(table.paymentId),
  ],
);

export const eventPaymentSessions = pgTable(
  "event_payment_sessions",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(() => createId())
      .primaryKey(),
    registrationId: uuid("registration_id").notNull(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    squareCheckoutId: varchar("square_checkout_id", { length: 255 }).notNull(),
    squarePaymentLinkUrl: varchar("square_payment_link_url", { length: 2048 }).notNull(),
    squareOrderId: varchar("square_order_id", { length: 255 }),
    squarePaymentId: varchar("square_payment_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("CAD"),
    expiresAt: timestamp("expires_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_payment_sessions_checkout_idx").on(table.squareCheckoutId),
    index("event_payment_sessions_payment_idx").on(table.squarePaymentId),
    index("event_payment_sessions_registration_idx").on(table.registrationId),
    index("event_payment_sessions_event_idx").on(table.eventId),
    index("event_payment_sessions_user_idx").on(table.userId),
    foreignKey({
      columns: [table.registrationId],
      foreignColumns: [eventRegistrations.id],
      name: "event_payment_sessions_registration_fk",
    }).onDelete("cascade"),
  ],
);

export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: checkoutProviderEnum("provider").notNull().default("square"),
    providerCheckoutId: varchar("provider_checkout_id", { length: 255 }).notNull(),
    providerCheckoutUrl: varchar("provider_checkout_url", { length: 2048 }),
    providerOrderId: varchar("provider_order_id", { length: 255 }),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    status: checkoutSessionStatusEnum("status").notNull().default("pending"),
    amountTotalCents: integer("amount_total_cents").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("CAD"),
    expiresAt: timestamp("expires_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("checkout_sessions_user_idx").on(table.userId),
    index("checkout_sessions_status_idx").on(table.status),
    index("checkout_sessions_payment_idx").on(table.providerPaymentId),
    uniqueIndex("checkout_sessions_provider_checkout_idx").on(table.providerCheckoutId),
  ],
);

export const checkoutItems = pgTable(
  "checkout_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    checkoutSessionId: varchar("checkout_session_id", { length: 255 })
      .notNull()
      .references(() => checkoutSessions.id, { onDelete: "cascade" }),
    itemType: checkoutItemTypeEnum("item_type").notNull(),
    description: varchar("description", { length: 500 }),
    quantity: integer("quantity").notNull().default(1),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("CAD"),
    eventRegistrationId: uuid("event_registration_id").references(
      () => eventRegistrations.id,
      { onDelete: "set null" },
    ),
    membershipPurchaseId: uuid("membership_purchase_id").references(
      () => membershipPurchases.id,
      { onDelete: "set null" },
    ),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("checkout_items_session_idx").on(table.checkoutSessionId),
    index("checkout_items_event_reg_idx").on(table.eventRegistrationId),
    index("checkout_items_membership_idx").on(table.membershipPurchaseId),
  ],
);

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
  registrationGroups: many(registrationGroups),
  registrations: many(eventRegistrations),
  paymentSessions: many(eventPaymentSessions),
  announcements: many(eventAnnouncements),
}));

export const registrationGroupsRelations = relations(
  registrationGroups,
  ({ one, many }) => ({
    event: one(events, {
      fields: [registrationGroups.eventId],
      references: [events.id],
    }),
    captain: one(user, {
      fields: [registrationGroups.captainUserId],
      references: [user.id],
    }),
    team: one(teams, {
      fields: [registrationGroups.teamId],
      references: [teams.id],
    }),
    members: many(registrationGroupMembers),
    invites: many(registrationInvites),
    registrations: many(eventRegistrations),
  }),
);

export const registrationGroupMembersRelations = relations(
  registrationGroupMembers,
  ({ one, many }) => ({
    group: one(registrationGroups, {
      fields: [registrationGroupMembers.groupId],
      references: [registrationGroups.id],
    }),
    user: one(user, {
      fields: [registrationGroupMembers.userId],
      references: [user.id],
    }),
    invitedBy: one(user, {
      fields: [registrationGroupMembers.invitedByUserId],
      references: [user.id],
    }),
    membershipPurchases: many(membershipPurchases),
  }),
);

export const registrationInvitesRelations = relations(registrationInvites, ({ one }) => ({
  group: one(registrationGroups, {
    fields: [registrationInvites.groupId],
    references: [registrationGroups.id],
  }),
  acceptedBy: one(user, {
    fields: [registrationInvites.acceptedByUserId],
    references: [user.id],
  }),
}));

export const eventRegistrationsRelations = relations(
  eventRegistrations,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventRegistrations.eventId],
      references: [events.id],
    }),
    registrationGroup: one(registrationGroups, {
      fields: [eventRegistrations.registrationGroupId],
      references: [registrationGroups.id],
    }),
    team: one(teams, {
      fields: [eventRegistrations.teamId],
      references: [teams.id],
    }),
    user: one(user, {
      fields: [eventRegistrations.userId],
      references: [user.id],
    }),
    paymentSessions: many(eventPaymentSessions),
  }),
);

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

export const eventPaymentSessionsRelations = relations(
  eventPaymentSessions,
  ({ one }) => ({
    event: one(events, {
      fields: [eventPaymentSessions.eventId],
      references: [events.id],
    }),
    registration: one(eventRegistrations, {
      fields: [eventPaymentSessions.registrationId],
      references: [eventRegistrations.id],
    }),
    user: one(user, {
      fields: [eventPaymentSessions.userId],
      references: [user.id],
    }),
  }),
);

export const membershipPurchasesRelations = relations(membershipPurchases, ({ one }) => ({
  membershipType: one(membershipTypes, {
    fields: [membershipPurchases.membershipTypeId],
    references: [membershipTypes.id],
  }),
  user: one(user, {
    fields: [membershipPurchases.userId],
    references: [user.id],
  }),
  event: one(events, {
    fields: [membershipPurchases.eventId],
    references: [events.id],
  }),
  registrationGroupMember: one(registrationGroupMembers, {
    fields: [membershipPurchases.registrationGroupMemberId],
    references: [registrationGroupMembers.id],
  }),
  membership: one(memberships, {
    fields: [membershipPurchases.membershipId],
    references: [memberships.id],
  }),
}));

export const checkoutSessionsRelations = relations(checkoutSessions, ({ one, many }) => ({
  user: one(user, {
    fields: [checkoutSessions.userId],
    references: [user.id],
  }),
  items: many(checkoutItems),
}));

export const checkoutItemsRelations = relations(checkoutItems, ({ one }) => ({
  session: one(checkoutSessions, {
    fields: [checkoutItems.checkoutSessionId],
    references: [checkoutSessions.id],
  }),
  eventRegistration: one(eventRegistrations, {
    fields: [checkoutItems.eventRegistrationId],
    references: [eventRegistrations.id],
  }),
  membershipPurchase: one(membershipPurchases, {
    fields: [checkoutItems.membershipPurchaseId],
    references: [membershipPurchases.id],
  }),
}));

// Zod schemas
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export const insertRegistrationGroupSchema = createInsertSchema(registrationGroups);
export const selectRegistrationGroupSchema = createSelectSchema(registrationGroups);
export const insertRegistrationGroupMemberSchema = createInsertSchema(
  registrationGroupMembers,
);
export const selectRegistrationGroupMemberSchema = createSelectSchema(
  registrationGroupMembers,
);
export const insertRegistrationInviteSchema = createInsertSchema(registrationInvites);
export const selectRegistrationInviteSchema = createSelectSchema(registrationInvites);
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations);
export const selectEventRegistrationSchema = createSelectSchema(eventRegistrations);
export const insertMembershipPurchaseSchema = createInsertSchema(membershipPurchases);
export const selectMembershipPurchaseSchema = createSelectSchema(membershipPurchases);
export const insertEventAnnouncementSchema = createInsertSchema(eventAnnouncements);
export const selectEventAnnouncementSchema = createSelectSchema(eventAnnouncements);
export const insertEventPaymentSessionSchema = createInsertSchema(eventPaymentSessions);
export const selectEventPaymentSessionSchema = createSelectSchema(eventPaymentSessions);
export const insertCheckoutSessionSchema = createInsertSchema(checkoutSessions);
export const selectCheckoutSessionSchema = createSelectSchema(checkoutSessions);
export const insertCheckoutItemSchema = createInsertSchema(checkoutItems);
export const selectCheckoutItemSchema = createSelectSchema(checkoutItems);

// Inferred types
export type EventPaymentSession = typeof eventPaymentSessions.$inferSelect;
export type NewEventPaymentSession = typeof eventPaymentSessions.$inferInsert;
export type RegistrationGroup = typeof registrationGroups.$inferSelect;
export type NewRegistrationGroup = typeof registrationGroups.$inferInsert;
export type RegistrationGroupMember = typeof registrationGroupMembers.$inferSelect;
export type NewRegistrationGroupMember = typeof registrationGroupMembers.$inferInsert;
export type RegistrationInvite = typeof registrationInvites.$inferSelect;
export type NewRegistrationInvite = typeof registrationInvites.$inferInsert;
export type MembershipPurchase = typeof membershipPurchases.$inferSelect;
export type NewMembershipPurchase = typeof membershipPurchases.$inferInsert;
export type CheckoutSession = typeof checkoutSessions.$inferSelect;
export type NewCheckoutSession = typeof checkoutSessions.$inferInsert;
export type CheckoutItem = typeof checkoutItems.$inferSelect;
export type NewCheckoutItem = typeof checkoutItems.$inferInsert;

// Custom validation schemas
export const baseCreateEventSchema = z.object({
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
  province: z.string().optional(),
  postalCode: z.string().optional(),
  startDate: z.string(), // Will be converted to Date
  endDate: z.string(), // Will be converted to Date
  registrationType: z.enum(["team", "individual", "both"]),
  maxTeams: z.int().positive().optional(),
  maxParticipants: z.int().positive().optional(),
  minPlayersPerPair: z.int().positive().optional(),
  maxPlayersPerPair: z.int().positive().optional(),
  minPlayersPerRelay: z.int().positive().optional(),
  maxPlayersPerRelay: z.int().positive().optional(),
  teamRegistrationFee: z.int().min(0).optional(),
  individualRegistrationFee: z.int().min(0).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().optional(),
  allowWaitlist: z.boolean().optional(),
  requireMembership: z.boolean().optional(),
  allowEtransfer: z.boolean().optional(),
  etransferRecipient: z
    .email("Enter a valid e-transfer email")
    .optional()
    .or(z.literal("")),
  etransferInstructions: z.string().max(2000).optional(),
});

export const createEventInputSchema = baseCreateEventSchema.superRefine((values, ctx) => {
  if (values.allowEtransfer) {
    const recipient = values.etransferRecipient?.trim() ?? "";
    if (!recipient) {
      ctx.addIssue({
        path: ["etransferRecipient"],
        code: "custom",
        message: "E-transfer recipient email is required when e-transfer is enabled",
      });
    }
  }

  if (
    values.minPlayersPerPair !== undefined &&
    values.maxPlayersPerPair !== undefined &&
    values.minPlayersPerPair > values.maxPlayersPerPair
  ) {
    ctx.addIssue({
      path: ["minPlayersPerPair"],
      code: "custom",
      message: "Minimum pair size cannot exceed the maximum",
    });
  }

  if (
    values.minPlayersPerRelay !== undefined &&
    values.maxPlayersPerRelay !== undefined &&
    values.minPlayersPerRelay > values.maxPlayersPerRelay
  ) {
    ctx.addIssue({
      path: ["minPlayersPerRelay"],
      code: "custom",
      message: "Minimum relay size cannot exceed the maximum",
    });
  }
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type EventAnnouncement = typeof eventAnnouncements.$inferSelect;
export type NewEventAnnouncement = typeof eventAnnouncements.$inferInsert;
