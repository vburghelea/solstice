import { z } from "zod";

const intentFilterOperatorSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains",
]);

const intentFilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean()),
]);

const timeRangePresetSchema = z.enum([
  "last_7_days",
  "last_30_days",
  "last_year",
  "ytd",
  "all_time",
]);

export const queryIntentSchema = z.object({
  datasetId: z.string().min(1),
  metrics: z.array(z.string()).min(1),
  dimensions: z.array(z.string()).default([]),
  filters: z
    .array(
      z.object({
        dimensionId: z.string().min(1),
        operator: intentFilterOperatorSchema,
        value: intentFilterValueSchema,
      }),
    )
    .default([]),
  timeRange: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
      preset: timeRangePresetSchema.optional(),
    })
    .optional(),
  limit: z.number().min(1).max(10_000).default(1000),
  sort: z
    .object({
      field: z.string().min(1),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1),
});

export type QueryIntent = z.infer<typeof queryIntentSchema>;
