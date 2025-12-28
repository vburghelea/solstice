import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const tutorialStatusEnum = pgEnum("tutorial_status", [
  "started",
  "completed",
  "dismissed",
]);

export const tutorialCompletions = pgTable(
  "tutorial_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tutorialId: text("tutorial_id").notNull(),
    status: tutorialStatusEnum("status").notNull().default("started"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("tutorial_completions_unique").on(table.userId, table.tutorialId),
    index("tutorial_completions_user_idx").on(table.userId, table.status),
  ],
);

export type TutorialCompletion = typeof tutorialCompletions.$inferSelect;
export type NewTutorialCompletion = typeof tutorialCompletions.$inferInsert;
