import { z } from "zod";

export const listDataCatalogEntriesSchema = z
  .object({
    organizationId: z.uuid().optional(),
    sourceType: z.string().min(1).optional(),
    search: z.string().trim().min(1).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const syncDataCatalogSchema = z
  .object({
    includeTemplates: z.boolean().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});
