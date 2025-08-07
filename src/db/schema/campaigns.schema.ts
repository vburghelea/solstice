import { createId } from "@paralleldrive/cuid2";
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
import { user } from "./auth.schema";
import { gameSystems as gameSystem } from "./game-systems.schema";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "active",
  "cancelled",
  "completed",
]);
export const campaignVisibilityEnum = pgEnum("campaign_visibility", [
  "public",
  "protected",
  "private",
]);
export const campaignRecurrenceEnum = pgEnum("campaign_recurrence", [
  "weekly",
  "bi-weekly",
  "monthly",
]);
export const campaignApplicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const campaigns = pgTable("campaigns", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
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
  visibility: campaignVisibilityEnum("visibility").notNull().default("public"),
  safetyRules: jsonb("safety_rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignParticipantRoleEnum = pgEnum("campaign_participant_role", [
  "owner",
  "player",
  "invited",
  "applicant",
]);
export const campaignParticipantStatusEnum = pgEnum("campaign_participant_status", [
  "approved",
  "rejected",
  "pending",
]);

export const campaignParticipants = pgTable("campaign_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: campaignParticipantRoleEnum("role").notNull(),
  status: campaignParticipantStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignApplications = pgTable("campaign_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: campaignApplicationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  owner: one(user, {
    fields: [campaigns.ownerId],
    references: [user.id],
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
