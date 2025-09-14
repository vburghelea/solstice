import { z } from "zod";

// Query schemas
export const listSystemsSchema = z.object({
  mechanicsIds: z.array(z.number()).optional(),
  genreIds: z.array(z.number()).optional(),
  playersMin: z.number().int().optional(),
  playersMax: z.number().int().optional(),
  publisherIds: z.array(z.number()).optional(),
  releasedFrom: z.coerce.date().optional(),
  releasedTo: z.coerce.date().optional(),
  q: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(50).optional().default(20),
});
export type ListSystemsInput = z.infer<typeof listSystemsSchema>;

export const getSystemBySlugSchema = z.object({
  slug: z.string(),
});
export type GetSystemBySlugInput = z.infer<typeof getSystemBySlugSchema>;

// Mutation schemas
export const upsertCmsContentSchema = z.object({
  systemId: z.number().int(),
  description: z.string().optional(),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional(),
});
export type UpsertCmsContentInput = z.infer<typeof upsertCmsContentSchema>;

export const reorderImagesSchema = z.object({
  systemId: z.number().int(),
  imageIds: z.array(z.number().int()),
});
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;

export const mapExternalTagSchema = z.object({
  systemId: z.number().int(),
  source: z.enum(["startplaying", "bgg", "wikipedia"]),
  externalId: z.string(),
  confidence: z.number().min(0).max(1).default(1),
});
export type MapExternalTagInput = z.infer<typeof mapExternalTagSchema>;

export const triggerRecrawlSchema = z.object({
  systemId: z.number().int(),
  source: z.enum(["startplaying", "bgg", "wikipedia"]).optional(),
});
export type TriggerRecrawlInput = z.infer<typeof triggerRecrawlSchema>;
