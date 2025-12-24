import { z } from "zod";

export const auditCategorySchema = z.enum([
  "AUTH",
  "ADMIN",
  "DATA",
  "EXPORT",
  "SECURITY",
]);

export const listAuditLogsSchema = z
  .object({
    actorUserId: z.string().optional(),
    targetOrgId: z.uuid().optional(),
    actionCategory: auditCategorySchema.optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  })
  .nullish()
  .transform((value) => value ?? { limit: 100 });
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
