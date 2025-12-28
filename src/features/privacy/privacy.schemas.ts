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

export const legalHoldScopeSchema = z.enum(["user", "organization", "record"]);

export const privacyRequestDetailsSchema = z.object({
  correction: z.string().trim().min(1).max(2000),
  fields: z.array(z.string().trim().min(1)).optional(),
});

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

export const createPrivacyRequestSchema = z
  .object({
    type: privacyRequestTypeSchema,
    details: privacyRequestDetailsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "correction" && !value.details) {
      ctx.addIssue({
        code: "custom",
        message: "Correction requests require details.",
        path: ["details"],
      });
    }
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

export const applyPrivacyCorrectionSchema = z.object({
  requestId: z.uuid(),
  corrections: z
    .object({
      name: z.string().trim().min(1).optional(),
      email: z.email().optional(),
      dateOfBirth: z.string().optional(),
      emergencyContact: z
        .object({
          name: z.string().trim().min(1),
          relationship: z.string().trim().min(1),
          phone: z.string().trim().optional(),
          email: z.email().optional(),
        })
        .optional(),
      gender: z.string().trim().optional(),
      pronouns: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      privacySettings: z
        .object({
          showEmail: z.boolean(),
          showPhone: z.boolean(),
          showBirthYear: z.boolean(),
          allowTeamInvitations: z.boolean(),
        })
        .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one correction is required.",
    }),
  notes: z.string().trim().max(500).optional(),
});
export type ApplyPrivacyCorrectionInput = z.infer<typeof applyPrivacyCorrectionSchema>;

export const getPrivacyExportUrlSchema = z.object({
  requestId: z.uuid(),
});
export type GetPrivacyExportUrlInput = z.infer<typeof getPrivacyExportUrlSchema>;

export const createLegalHoldSchema = z.object({
  scopeType: legalHoldScopeSchema,
  scopeId: z.string().trim().min(1),
  dataType: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1).max(500),
});
export type CreateLegalHoldInput = z.infer<typeof createLegalHoldSchema>;

export const releaseLegalHoldSchema = z.object({
  holdId: z.uuid(),
  reason: z.string().trim().max(500).optional(),
});
export type ReleaseLegalHoldInput = z.infer<typeof releaseLegalHoldSchema>;
