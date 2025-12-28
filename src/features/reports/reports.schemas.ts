import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const exportTypeSchema = z.enum(["csv", "excel"]);
export const pivotAggregationSchema = z.enum(["count", "sum", "avg", "min", "max"]);

export const pivotMeasureSchema = z.object({
  field: z.string().optional(),
  aggregation: pivotAggregationSchema,
});

export const pivotQuerySchema = z.object({
  dataSource: z.string().min(1),
  organizationId: z.uuid().optional(),
  filters: jsonRecordSchema.optional(),
  rows: z.array(z.string()).optional(),
  columns: z.array(z.string()).optional(),
  measures: z.array(pivotMeasureSchema).min(1),
});
export type PivotQueryInput = z.infer<typeof pivotQuerySchema>;

export const createSavedReportSchema = z.object({
  organizationId: z.uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  dataSource: z.string().min(1),
  filters: jsonRecordSchema.optional(),
  columns: z.array(z.string()).optional(),
  sort: jsonRecordSchema.optional(),
  sharedWith: z.array(z.string()).optional(),
  isOrgWide: z.boolean().optional(),
});
export type CreateSavedReportInput = z.infer<typeof createSavedReportSchema>;

export const exportReportSchema = z.object({
  dataSource: z.string().min(1),
  organizationId: z.uuid().optional(),
  filters: jsonRecordSchema.optional(),
  columns: z.array(z.string()).optional(),
  sort: jsonRecordSchema.optional(),
  exportType: exportTypeSchema,
});
export type ExportReportInput = z.infer<typeof exportReportSchema>;

export const pivotExportSchema = pivotQuerySchema.extend({
  exportType: exportTypeSchema,
});
export type PivotExportInput = z.infer<typeof pivotExportSchema>;

export const updateSavedReportSchema = z.object({
  reportId: z.uuid(),
  data: createSavedReportSchema.partial(),
});
export type UpdateSavedReportInput = z.infer<typeof updateSavedReportSchema>;

export const deleteSavedReportSchema = z.object({
  reportId: z.uuid(),
});
export type DeleteSavedReportInput = z.infer<typeof deleteSavedReportSchema>;
