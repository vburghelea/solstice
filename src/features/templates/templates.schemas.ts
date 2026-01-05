import { z } from "zod";

export const templateContextSchema = z.enum([
  "forms",
  "imports",
  "reporting",
  "analytics",
  "general",
]);
export type TemplateContext = z.infer<typeof templateContextSchema>;

export const listTemplatesSchema = z
  .object({
    organizationId: z.uuid().optional(),
    context: templateContextSchema.optional(),
    search: z.string().trim().min(1).optional(),
    includeArchived: z.boolean().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const createTemplateUploadSchema = z.object({
  organizationId: z.uuid().optional(),
  context: templateContextSchema.optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const createTemplateSchema = z.object({
  organizationId: z.uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  context: templateContextSchema.default("general"),
  tags: z.array(z.string().min(1)).optional(),
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const updateTemplateSchema = z.object({
  templateId: z.uuid(),
  data: createTemplateSchema.partial().extend({
    isArchived: z.boolean().optional(),
  }),
});

export const deleteTemplateSchema = z.object({
  templateId: z.uuid(),
});

export const templateIdSchema = z.object({
  templateId: z.uuid(),
});
export const getTemplateDownloadSchema = templateIdSchema;
export const getTemplatePreviewSchema = templateIdSchema;

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;
