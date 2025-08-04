import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { gameSystems as gameSystem } from "./game-systems.schema";

// Enums for game status and visibility
export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "canceled",
  "completed",
]);
export const gameVisibilityEnum = pgEnum("game_visibility", [
  "public",
  "protected",
  "private",
]);
export const gameParticipantRoleEnum = pgEnum("game_participant_role", [
  "player",
  "invited",
  "applicant",
]);
export const gameParticipantStatusEnum = pgEnum("game_participant_status", [
  "approved",
  "rejected",
  "pending",
]);

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  gameSystemId: integer("game_system_id")
    .notNull()
    .references(() => gameSystem.id, { onDelete: "cascade" }),
  dateTime: timestamp("date_time", { mode: "date" }).notNull(),
  description: text("description").notNull(),
  expectedDuration: real("expected_duration").notNull(), // in hours
  price: real("price"), // optional price for the session
  language: varchar("language", { length: 50 }).notNull(),
  location: jsonb("location").notNull(), // Google Maps geocoded entity
  status: gameStatusEnum("status").notNull().default("scheduled"),
  minimumRequirements: jsonb("minimum_requirements"), // e.g., { language: "en", city: "Berlin" }
  visibility: gameVisibilityEnum("visibility").notNull().default("public"),
  safetyRules: jsonb("safety_rules"), // e.g., ["no-alcohol", "safe-word"]
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const gameParticipants = pgTable("game_participants", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: gameParticipantRoleEnum("role").notNull().default("player"),
  status: gameParticipantStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const gamesRelations = relations(games, ({ one, many }) => ({
  owner: one(user, {
    fields: [games.ownerId],
    references: [user.id],
  }),
  gameSystem: one(gameSystem, {
    fields: [games.gameSystemId],
    references: [gameSystem.id],
  }),
  participants: many(gameParticipants),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
  user: one(user, {
    fields: [gameParticipants.userId],
    references: [user.id],
  }),
}));
