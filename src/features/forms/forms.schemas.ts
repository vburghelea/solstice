import { z } from "zod";
import { jsonRecordSchema, jsonValueSchema } from "~/shared/lib/json";

export const formFieldTypeSchema = z.enum([
  "text",
  "number",
  "email",
  "phone",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "file",
  "textarea",
  "rich_text",
]);

export const validationRuleSchema = z.object({
  type: z.enum(["min_length", "max_length", "pattern", "min", "max", "custom"]),
  value: z.union([z.string(), z.number()]),
  message: z.string(),
});

export const formFieldSchema = z.object({
  key: z.string().min(1),
  type: formFieldTypeSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: z.array(validationRuleSchema).optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  conditional: z
    .object({
      field: z.string(),
      operator: z.enum(["equals", "not_equals", "contains", "greater_than"]),
      value: jsonValueSchema,
    })
    .optional(),
  fileConfig: z
    .object({
      allowedTypes: z.array(z.string()),
      maxSizeBytes: z.number().int(),
      maxFiles: z.number().int(),
    })
    .optional(),
});

export const formDefinitionSchema = z.object({
  fields: z.array(formFieldSchema),
  layout: z
    .object({
      sections: z.array(
        z.object({
          title: z.string(),
          fieldKeys: z.array(z.string()),
        }),
      ),
    })
    .optional(),
  settings: z.object({
    allowDraft: z.boolean(),
    requireApproval: z.boolean(),
    notifyOnSubmit: z.array(z.string()),
  }),
});

export type FormDefinition = z.infer<typeof formDefinitionSchema>;

export const formSubmissionStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
]);

export const createFormSchema = z.object({
  organizationId: z.uuid().optional().nullable(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});
export type CreateFormInput = z.infer<typeof createFormSchema>;

export const updateFormSchema = z.object({
  formId: z.uuid(),
  data: createFormSchema.partial(),
});
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

export const publishFormSchema = z.object({
  formId: z.uuid(),
  definition: formDefinitionSchema,
});
export type PublishFormInput = z.infer<typeof publishFormSchema>;

export const submitFormSchema = z.object({
  formId: z.uuid(),
  organizationId: z.uuid().optional().nullable(),
  payload: jsonRecordSchema,
  status: z.enum(["draft", "submitted"]).optional(),
  changeReason: z.string().optional(),
  importJobId: z.uuid().optional().nullable(),
});
export type SubmitFormInput = z.infer<typeof submitFormSchema>;

export const updateFormSubmissionSchema = z.object({
  submissionId: z.uuid(),
  payload: jsonRecordSchema,
  status: z.enum(["draft", "submitted"]).optional(),
  changeReason: z.string().optional(),
});
export type UpdateFormSubmissionInput = z.infer<typeof updateFormSubmissionSchema>;

export const reviewFormSubmissionSchema = z.object({
  submissionId: z.uuid(),
  status: formSubmissionStatusSchema.exclude(["draft", "submitted"]),
  reviewNotes: z.string().optional(),
});
export type ReviewFormSubmissionInput = z.infer<typeof reviewFormSubmissionSchema>;

export const createFormUploadSchema = z.object({
  formId: z.uuid(),
  fieldKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type CreateFormUploadInput = z.infer<typeof createFormUploadSchema>;

export const listSubmissionFilesSchema = z.object({
  submissionId: z.uuid(),
});
export type ListSubmissionFilesInput = z.infer<typeof listSubmissionFilesSchema>;

export const getSubmissionFileDownloadSchema = z.object({
  submissionFileId: z.uuid(),
});
export type GetSubmissionFileDownloadInput = z.infer<
  typeof getSubmissionFileDownloadSchema
>;
