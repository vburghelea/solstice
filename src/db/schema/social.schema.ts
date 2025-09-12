// src/db/schema/social.schema.ts
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { games } from "./games.schema";

export const gmStrengthEnum = pgEnum("gm_strength", [
  "creativity",
  "world_builder",
  "inclusive",
  "rule_of_cool",
  "storytelling",
  "voices",
  "sets_the_mood",
  "teacher",
  "knows_the_rules",
  "visual_aid",
]);

// Social audit action enum
export const socialActionEnum = pgEnum("social_action", [
  "follow",
  "unfollow",
  "block",
  "unblock",
]);

// Follow relationships
export const userFollows = pgTable(
  "user_follows",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    // Prevent duplicate follows
  },
  (table) => ({
    uniqueFollow: {
      name: "unique_follow",
      columns: [table.followerId, table.followingId],
    },
  }),
);

// Block relationships (unidirectional)
export const userBlocks = pgTable(
  "user_blocks",
  {
    id: text("id").primaryKey(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockeeId: text("blockee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    uniqueBlock: {
      name: "user_blocks_unique",
      columns: [table.blockerId, table.blockeeId],
    },
  }),
);

// GM Reviews
export const gmReviews = pgTable(
  "gm_reviews",
  {
    id: text("id").primaryKey(),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gmId: text("gm_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // stored 1-5 scale (thumbs -2..2 mapped to 1..5)
    selectedStrengths: jsonb("selected_strengths").$type<string[]>().default([]),
    comment: text("comment"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    uniqueReviewerPerGame: {
      name: "gm_review_unique_reviewer_per_game",
      columns: [table.reviewerId, table.gameId],
    },
  }),
);

// Social audit logs
export const socialAuditLogs = pgTable("social_audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  targetUserId: text("target_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  action: socialActionEnum("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Types
export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;
export type UserBlock = typeof userBlocks.$inferSelect;
export type NewUserBlock = typeof userBlocks.$inferInsert;
export type GMReview = typeof gmReviews.$inferSelect;
export type NewGMReview = typeof gmReviews.$inferInsert;
export type SocialAuditLog = typeof socialAuditLogs.$inferSelect;
export type NewSocialAuditLog = typeof socialAuditLogs.$inferInsert;
