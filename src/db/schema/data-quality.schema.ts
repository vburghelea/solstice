import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";

export const dataQualityRunStatusEnum = pgEnum("data_quality_run_status", [
  "success",
  "failed",
]);

export const dataQualityRuns = pgTable("data_quality_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: dataQualityRunStatusEnum("status").notNull().default("success"),
  summary: jsonb("summary").$type<JsonRecord>().notNull().default({}),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DataQualityRun = typeof dataQualityRuns.$inferSelect;
export type NewDataQualityRun = typeof dataQualityRuns.$inferInsert;
