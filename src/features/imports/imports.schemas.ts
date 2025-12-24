import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const importTypeSchema = z.enum(["csv", "excel"]);
export const importLaneSchema = z.enum(["interactive", "batch"]);

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

export const createMappingTemplateSchema = z.object({
  organizationId: z.uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetFormId: z.uuid().optional(),
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
  rows: z.array(jsonRecordSchema),
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
