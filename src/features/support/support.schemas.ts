import { z } from "zod";

export const supportCategorySchema = z.enum([
  "question",
  "issue",
  "feature_request",
  "feedback",
]);

export const supportStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);

export const supportPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const createSupportRequestSchema = z.object({
  organizationId: z.uuid().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  category: supportCategorySchema.default("question"),
  priority: supportPrioritySchema.default("normal"),
});

export const listSupportRequestsSchema = z
  .object({
    organizationId: z.uuid().optional(),
    status: supportStatusSchema.optional(),
    search: z.string().trim().min(1).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const respondSupportRequestSchema = z.object({
  requestId: z.uuid(),
  status: supportStatusSchema.optional(),
  responseMessage: z.string().min(1).optional(),
  priority: supportPrioritySchema.optional(),
  slaTargetAt: z.iso.datetime().optional(),
});

export const createSupportRequestAttachmentUploadSchema = z.object({
  requestId: z.uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const createSupportRequestAttachmentSchema =
  createSupportRequestAttachmentUploadSchema.extend({
    storageKey: z.string().min(1),
  });

export const getSupportRequestAttachmentDownloadSchema = z.object({
  attachmentId: z.uuid(),
});

export type CreateSupportRequestInput = z.infer<typeof createSupportRequestSchema>;
