import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const reportingCycleStatusSchema = z.enum([
  "upcoming",
  "active",
  "closed",
  "archived",
]);

export const reportingSubmissionStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "overdue",
]);

export const reportingOrganizationTypeSchema = z.enum([
  "governing_body",
  "pso",
  "league",
  "club",
  "affiliate",
]);

export const createReportingCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
export type CreateReportingCycleInput = z.infer<typeof createReportingCycleSchema>;

export const createReportingTaskSchema = z.object({
  cycleId: z.uuid(),
  formId: z.uuid(),
  organizationId: z.uuid().optional(),
  organizationType: reportingOrganizationTypeSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().min(1),
  reminderConfig: jsonRecordSchema.optional(),
});
export type CreateReportingTaskInput = z.infer<typeof createReportingTaskSchema>;

export const updateReportingSubmissionSchema = z.object({
  submissionId: z.uuid(),
  status: reportingSubmissionStatusSchema,
  reviewNotes: z.string().optional(),
  formSubmissionId: z.uuid().optional(),
  formSubmissionVersionId: z.uuid().optional(),
});
export type UpdateReportingSubmissionInput = z.infer<
  typeof updateReportingSubmissionSchema
>;
