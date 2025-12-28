import { z } from "zod";

export const auditCategorySchema = z.enum([
  "AUTH",
  "ADMIN",
  "DATA",
  "EXPORT",
  "SECURITY",
]);

const auditDateFilterSchema = z.union([
  z.iso.datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
]);

export const listAuditLogsSchema = z
  .object({
    actorUserId: z.string().optional(),
    targetOrgId: z.uuid().optional(),
    actionCategory: auditCategorySchema.optional(),
    from: auditDateFilterSchema.optional(),
    to: auditDateFilterSchema.optional(),
    limit: z.number().int().min(1).max(500).optional(),
  })
  .nullish()
  .transform((value) => value ?? { limit: 100 });
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
