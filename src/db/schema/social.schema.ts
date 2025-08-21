// src/db/schema/social.schema.ts
import { integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

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

// GM Reviews
export const gmReviews = pgTable("gm_reviews", {
  id: text("id").primaryKey(),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  gmId: text("gm_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 scale
  selectedStrengths: jsonb("selected_strengths").$type<string[]>().default([]),
  comment: text("comment"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Types
export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;
export type GMReview = typeof gmReviews.$inferSelect;
export type NewGMReview = typeof gmReviews.$inferInsert;
