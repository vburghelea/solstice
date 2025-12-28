import { z } from "zod";

export const listDataQualityRunsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const runDataQualitySchema = z.object({});
