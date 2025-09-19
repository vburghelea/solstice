import { z } from "zod";

export const listAdminGameSystemsSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum(["all", "needs_curation", "errors", "published", "unpublished"])
    .optional()
    .default("all"),
  sort: z
    .enum(["updated-desc", "name-asc", "crawl-status"])
    .optional()
    .default("updated-desc"),
});

export type ListAdminGameSystemsInput = z.infer<typeof listAdminGameSystemsSchema>;

export const getAdminGameSystemSchema = z.object({
  systemId: z.number().int().positive(),
});

export type GetAdminGameSystemInput = z.infer<typeof getAdminGameSystemSchema>;
