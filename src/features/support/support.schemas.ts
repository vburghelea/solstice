import { z } from "zod";

export const supportCategorySchema = z.enum([
  "question",
  "issue",
  "feature_request",
  "feedback",
]);

export const supportStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);

export const createSupportRequestSchema = z.object({
  organizationId: z.uuid().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  category: supportCategorySchema.default("question"),
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
});

export type CreateSupportRequestInput = z.infer<typeof createSupportRequestSchema>;
