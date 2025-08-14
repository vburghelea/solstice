import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod"; // Import z
import { applicationStatusEnum, visibilityEnum } from "~/db/schema/shared.schema"; // Added applicationStatusEnum
import {
  campaignExpectationsSchema, // Import new schemas
  sessionZeroSchema,
  tableExpectationsSchema,
} from "~/features/campaigns/campaigns.schemas"; // Import new schemas
import { user } from "./auth.schema";
import { gameSystems as gameSystem } from "./game-systems.schema";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "active",
  "cancelled",
  "completed",
]);
export const campaignRecurrenceEnum = pgEnum("campaign_recurrence", [
  "weekly",
  "bi-weekly",
  "monthly",
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  gameSystemId: integer("game_system_id")
    .notNull()
    .references(() => gameSystem.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  images: jsonb("images").$type<string[]>(),
  recurrence: campaignRecurrenceEnum("recurrence").notNull(),
  timeOfDay: varchar("time_of_day", { length: 255 }).notNull(),
  sessionDuration: real("session_duration").notNull(), // in hours
  pricePerSession: real("price_per_session"), // optional price per session
  language: varchar("language", { length: 255 }).notNull(),
  location: jsonb("location"), // Google Maps geocoded entity
  status: campaignStatusEnum("status").notNull().default("active"),
  minimumRequirements: jsonb("minimum_requirements"),
  visibility: visibilityEnum("visibility").notNull().default("public"), // Changed to visibilityEnum
  safetyRules: jsonb("safety_rules"),
  // New fields for Session Zero
  sessionZeroData: jsonb("session_zero_data").$type<z.infer<
    typeof sessionZeroSchema
  > | null>(),
  campaignExpectations: jsonb("campaign_expectations").$type<z.infer<
    typeof campaignExpectationsSchema
  > | null>(),
  tableExpectations: jsonb("table_expectations").$type<z.infer<
    typeof tableExpectationsSchema
  > | null>(),
  characterCreationOutcome: text("character_creation_outcome").$type<string | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

import { participantRoleEnum, participantStatusEnum } from "~/db/schema/shared.schema";

export const campaignParticipants = pgTable("campaign_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: participantRoleEnum("role").notNull(),
  status: participantStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignApplications = pgTable("campaign_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull().default("pending"), // Changed to applicationStatusEnum
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  owner: one(user, {
    fields: [campaigns.ownerId],
    references: [user.id],
  }),
  gameSystem: one(gameSystem, {
    // Add this relation
    fields: [campaigns.gameSystemId],
    references: [gameSystem.id],
  }),
  participants: many(campaignParticipants),
  applications: many(campaignApplications),
}));

export const campaignParticipantsRelations = relations(
  campaignParticipants,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignParticipants.campaignId],
      references: [campaigns.id],
    }),
    user: one(user, {
      fields: [campaignParticipants.userId],
      references: [user.id],
    }),
  }),
);

export const campaignApplicationsRelations = relations(
  campaignApplications,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignApplications.campaignId],
      references: [campaigns.id],
    }),
    user: one(user, {
      fields: [campaignApplications.userId],
      references: [user.id],
    }),
  }),
);
