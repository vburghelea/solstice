import { z } from "zod";

// Query schemas
export const listSystemsSchema = z.object({
  genreIds: z.array(z.number()).optional(),
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
  targetType: z.enum(["category", "mechanic"]),
  targetId: z.number().int(),
  source: z.enum(["startplaying", "bgg", "wikipedia"]),
  externalTag: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1),
});
export type MapExternalTagInput = z.infer<typeof mapExternalTagSchema>;

export const triggerRecrawlSchema = z.object({
  systemId: z.number().int(),
  source: z.enum(["startplaying", "bgg", "wikipedia"]).optional(),
});
export type TriggerRecrawlInput = z.infer<typeof triggerRecrawlSchema>;

export const updatePublishStatusSchema = z.object({
  systemId: z.number().int(),
  isPublished: z.boolean(),
});
export type UpdatePublishStatusInput = z.infer<typeof updatePublishStatusSchema>;

export const updateCmsApprovalSchema = z.object({
  systemId: z.number().int(),
  approved: z.boolean(),
});
export type UpdateCmsApprovalInput = z.infer<typeof updateCmsApprovalSchema>;

export const uploadImageSchema = z.object({
  systemId: z.number().int(),
  url: z.string().url(),
  kind: z.enum(["hero", "gallery"]).default("gallery"),
  license: z.string().optional(),
  licenseUrl: z.string().url().optional(),
});
export type UploadImageInput = z.infer<typeof uploadImageSchema>;

export const moderateImageSchema = z.object({
  systemId: z.number().int(),
  mediaId: z.number().int(),
  moderated: z.boolean(),
});
export type ModerateImageInput = z.infer<typeof moderateImageSchema>;

export const selectHeroImageSchema = z.object({
  systemId: z.number().int(),
  mediaId: z.number().int(),
});
export type SelectHeroImageInput = z.infer<typeof selectHeroImageSchema>;
