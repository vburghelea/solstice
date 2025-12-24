import { z } from "zod";

export const policyTypeSchema = z.enum([
  "privacy_policy",
  "terms_of_service",
  "data_agreement",
]);

export const privacyRequestTypeSchema = z.enum([
  "access",
  "export",
  "erasure",
  "correction",
]);

export const privacyRequestStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "rejected",
]);

export const createPolicyDocumentSchema = z.object({
  type: policyTypeSchema,
  version: z.string().min(1),
  contentUrl: z.string().optional(),
  contentHash: z.string().min(1),
  effectiveDate: z.string().min(1),
});
export type CreatePolicyDocumentInput = z.infer<typeof createPolicyDocumentSchema>;

export const acceptPolicySchema = z.object({
  policyId: z.uuid(),
});
export type AcceptPolicyInput = z.infer<typeof acceptPolicySchema>;

export const createPrivacyRequestSchema = z.object({
  type: privacyRequestTypeSchema,
});
export type CreatePrivacyRequestInput = z.infer<typeof createPrivacyRequestSchema>;

export const updatePrivacyRequestSchema = z.object({
  requestId: z.uuid(),
  status: privacyRequestStatusSchema,
  resultUrl: z.string().optional(),
  resultNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});
export type UpdatePrivacyRequestInput = z.infer<typeof updatePrivacyRequestSchema>;

export const upsertRetentionPolicySchema = z.object({
  dataType: z.string().min(1),
  retentionDays: z.number().int().min(1),
  archiveAfterDays: z.number().int().min(0).optional(),
  purgeAfterDays: z.number().int().min(0).optional(),
  legalHold: z.boolean().optional(),
});
export type UpsertRetentionPolicyInput = z.infer<typeof upsertRetentionPolicySchema>;

export const generatePrivacyExportSchema = z.object({
  requestId: z.uuid(),
});
export type GeneratePrivacyExportInput = z.infer<typeof generatePrivacyExportSchema>;

export const applyPrivacyErasureSchema = z.object({
  requestId: z.uuid(),
  reason: z.string().trim().max(500).optional(),
});
export type ApplyPrivacyErasureInput = z.infer<typeof applyPrivacyErasureSchema>;

export const getPrivacyExportUrlSchema = z.object({
  requestId: z.uuid(),
});
export type GetPrivacyExportUrlInput = z.infer<typeof getPrivacyExportUrlSchema>;
