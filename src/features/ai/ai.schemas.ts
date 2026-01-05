import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const aiPromptVersionStatusSchema = z.enum(["draft", "active", "archived"]);
export const aiUsageStatusSchema = z.enum(["success", "error"]);
export const aiUsageOperationSchema = z.enum(["text", "structured", "embedding"]);

const promptKeySchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, - or _.");

export const listAiPromptTemplatesSchema = z
  .object({
    includeArchived: z.boolean().optional(),
    organizationId: z.uuid().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const createAiPromptTemplateSchema = z.object({
  key: promptKeySchema,
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  audiences: z.array(z.string().min(1)).optional().default([]),
  organizationId: z.uuid().optional(),
  systemPrompt: z.string().max(4000).optional(),
  userPrompt: z.string().min(1).max(8000),
  model: z.string().min(1).max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).optional(),
  modelOptions: jsonRecordSchema.optional(),
  variables: z.array(z.string().min(1)).optional().default([]),
  notes: z.string().max(2000).optional(),
  setActive: z.boolean().optional().default(true),
});

export const createAiPromptVersionSchema = z
  .object({
    templateId: z.uuid().optional(),
    key: promptKeySchema.optional(),
    systemPrompt: z.string().max(4000).optional(),
    userPrompt: z.string().min(1).max(8000),
    model: z.string().min(1).max(100).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().min(1).optional(),
    modelOptions: jsonRecordSchema.optional(),
    variables: z.array(z.string().min(1)).optional().default([]),
    notes: z.string().max(2000).optional(),
    status: aiPromptVersionStatusSchema.optional().default("draft"),
  })
  .refine((value) => value.templateId || value.key, {
    message: "templateId or key is required",
  });

export const setAiPromptVersionStatusSchema = z.object({
  promptVersionId: z.uuid(),
  status: aiPromptVersionStatusSchema,
});

export const listAiUsageLogsSchema = z
  .object({
    organizationId: z.uuid().optional(),
    userId: z.string().optional(),
    templateId: z.uuid().optional(),
    promptVersionId: z.uuid().optional(),
    status: aiUsageStatusSchema.optional(),
    operation: aiUsageOperationSchema.optional(),
    since: z.iso.datetime().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export type AiPromptVersionStatus = z.infer<typeof aiPromptVersionStatusSchema>;
