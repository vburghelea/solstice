import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const importTypeSchema = z.enum(["csv", "excel"]);
export const importLaneSchema = z.enum(["interactive", "batch"]);
export const templateFormatSchema = z.enum(["xlsx", "csv"]);

export const createImportJobSchema = z.object({
  organizationId: z.uuid(),
  type: importTypeSchema,
  lane: importLaneSchema,
  sourceFileKey: z.string().min(1),
  sourceFileHash: z.string().min(1),
  sourceRowCount: z.number().int().optional(),
  targetFormId: z.uuid().optional(),
  mappingTemplateId: z.uuid().optional(),
});
export type CreateImportJobInput = z.infer<typeof createImportJobSchema>;

export const updateImportJobStatusSchema = z.object({
  jobId: z.uuid(),
  status: z.enum([
    "pending",
    "validating",
    "validated",
    "importing",
    "completed",
    "failed",
    "cancelled",
    "rolled_back",
  ]),
  stats: jsonRecordSchema.optional(),
  errorSummary: jsonRecordSchema.optional(),
});
export type UpdateImportJobStatusInput = z.infer<typeof updateImportJobStatusSchema>;

export const updateImportJobSourceFileSchema = z.object({
  jobId: z.uuid(),
  sourceFileKey: z.string().min(1),
  sourceFileHash: z.string().min(1),
  sourceRowCount: z.number().int().nonnegative().optional(),
  changeSummary: jsonRecordSchema.optional(),
});
export type UpdateImportJobSourceFileInput = z.infer<
  typeof updateImportJobSourceFileSchema
>;

export const createMappingTemplateSchema = z.object({
  organizationId: z.uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetFormId: z.uuid().optional(),
  targetFormVersionId: z.uuid().optional(),
  mappings: jsonRecordSchema,
});
export type CreateMappingTemplateInput = z.infer<typeof createMappingTemplateSchema>;

export const createImportUploadSchema = z.object({
  organizationId: z.uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type CreateImportUploadInput = z.infer<typeof createImportUploadSchema>;

export const runInteractiveImportSchema = z.object({
  jobId: z.uuid(),
  formId: z.uuid(),
  mapping: jsonRecordSchema,
  rows: z.array(jsonRecordSchema).optional(),
});
export type RunInteractiveImportInput = z.infer<typeof runInteractiveImportSchema>;

export const runBatchImportSchema = z.object({
  jobId: z.uuid(),
});
export type RunBatchImportInput = z.infer<typeof runBatchImportSchema>;

export const rollbackImportJobSchema = z.object({
  jobId: z.uuid(),
  reason: z.string().optional(),
});
export type RollbackImportJobInput = z.infer<typeof rollbackImportJobSchema>;

export const updateMappingTemplateSchema = z.object({
  templateId: z.uuid(),
  data: createMappingTemplateSchema.partial(),
});
export type UpdateMappingTemplateInput = z.infer<typeof updateMappingTemplateSchema>;

export const deleteMappingTemplateSchema = z.object({
  templateId: z.uuid(),
});
export type DeleteMappingTemplateInput = z.infer<typeof deleteMappingTemplateSchema>;

export const createImportTemplateSchema = z.object({
  organizationId: z.uuid().optional(),
  formId: z.uuid(),
  formVersionId: z.uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  columns: jsonRecordSchema,
  defaults: jsonRecordSchema.optional(),
});
export type CreateImportTemplateInput = z.infer<typeof createImportTemplateSchema>;

export const updateImportTemplateSchema = z.object({
  templateId: z.uuid(),
  data: createImportTemplateSchema.partial(),
});
export type UpdateImportTemplateInput = z.infer<typeof updateImportTemplateSchema>;

export const deleteImportTemplateSchema = z.object({
  templateId: z.uuid(),
});
export type DeleteImportTemplateInput = z.infer<typeof deleteImportTemplateSchema>;

export const listImportTemplatesSchema = z
  .object({
    organizationId: z.uuid().optional(),
    formId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const downloadFormTemplateSchema = z.object({
  formId: z.uuid(),
  format: templateFormatSchema,
  options: z
    .object({
      includeDescriptions: z.boolean().optional(),
      includeExamples: z.boolean().optional(),
      includeDataValidation: z.boolean().optional(),
      includeMetadataMarkers: z.boolean().optional(),
      organizationId: z.uuid().optional(),
    })
    .optional(),
});
export type DownloadFormTemplateInput = z.infer<typeof downloadFormTemplateSchema>;

export const downloadImportTemplateSchema = z.object({
  templateId: z.uuid(),
  format: templateFormatSchema,
});
export type DownloadImportTemplateInput = z.infer<typeof downloadImportTemplateSchema>;
