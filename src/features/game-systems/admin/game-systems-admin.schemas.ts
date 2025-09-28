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
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
});

export type ListAdminGameSystemsInput = z.infer<typeof listAdminGameSystemsSchema>;

const publishActionSchema = z.object({
  type: z.literal("set-publish"),
  isPublished: z.boolean(),
});

const approvalActionSchema = z.object({
  type: z.literal("set-approval"),
  cmsApproved: z.boolean(),
});

const heroModerationActionSchema = z.object({
  type: z.literal("set-hero-moderation"),
  moderated: z.boolean(),
});

const recrawlActionSchema = z.object({
  type: z.literal("queue-recrawl"),
  source: z.string().trim().min(1).max(50).optional(),
});

const deactivateActionSchema = z.object({
  type: z.literal("deactivate"),
});

const deleteActionSchema = z.object({
  type: z.literal("delete"),
});

export const bulkAdminActionSchema = z.discriminatedUnion("type", [
  publishActionSchema,
  approvalActionSchema,
  heroModerationActionSchema,
  recrawlActionSchema,
  deactivateActionSchema,
  deleteActionSchema,
]);

export type BulkAdminAction = z.infer<typeof bulkAdminActionSchema>;

export const bulkUpdateAdminSystemsSchema = z.object({
  systemIds: z.array(z.number().int().positive()).min(1),
  action: bulkAdminActionSchema,
});

export type BulkUpdateAdminSystemsInput = z.infer<typeof bulkUpdateAdminSystemsSchema>;

const manualExternalSourceSchema = z
  .object({
    kind: z.enum(["startplaying", "bgg", "wikipedia", "custom"]),
    value: z.string().trim().min(1).max(255),
    customKey: z.string().trim().min(1).max(50).optional(),
  })
  .refine(
    (value) => (value.kind === "custom" ? Boolean(value.customKey?.trim()) : true),
    {
      message: "Custom sources require a reference key.",
      path: ["customKey"],
    },
  );

export const createManualGameSystemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  externalSource: manualExternalSourceSchema.optional(),
  queueRecrawl: z.boolean().optional(),
});

export type CreateManualGameSystemInput = z.infer<typeof createManualGameSystemSchema>;

export const getAdminGameSystemSchema = z.object({
  systemId: z.number().int().positive(),
});

export type GetAdminGameSystemInput = z.infer<typeof getAdminGameSystemSchema>;
