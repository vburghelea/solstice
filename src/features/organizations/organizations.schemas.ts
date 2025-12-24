import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const organizationTypeSchema = z.enum([
  "governing_body",
  "pso",
  "club",
  "affiliate",
]);

export const organizationStatusSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "archived",
]);

export const organizationRoleSchema = z.enum([
  "owner",
  "admin",
  "reporter",
  "viewer",
  "member",
]);

export const organizationMemberStatusSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "removed",
]);

export const delegatedAccessScopeSchema = z.enum(["reporting", "analytics", "admin"]);

export const getOrganizationSchema = z.object({
  organizationId: z.uuid(),
});
export type GetOrganizationInput = z.infer<typeof getOrganizationSchema>;

export const listOrganizationsSchema = z
  .object({
    includeArchived: z.boolean().optional(),
  })
  .nullish()
  .transform((value) => value ?? { includeArchived: false });
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;

export const searchOrganizationsSchema = z.object({
  query: z.string().trim().min(1),
});
export type SearchOrganizationsInput = z.infer<typeof searchOrganizationsSchema>;

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Organization slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters and hyphens"),
  type: organizationTypeSchema,
  parentOrgId: z.uuid().optional().nullable(),
  settings: jsonRecordSchema.optional(),
  metadata: jsonRecordSchema.optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  organizationId: z.uuid(),
  data: createOrganizationSchema
    .partial()
    .extend({ status: organizationStatusSchema.optional() }),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const inviteOrganizationMemberSchema = z.object({
  organizationId: z.uuid(),
  email: z.email("Please enter a valid email address"),
  role: organizationRoleSchema,
});
export type InviteOrganizationMemberInput = z.infer<
  typeof inviteOrganizationMemberSchema
>;

export const approveOrganizationMemberSchema = z.object({
  membershipId: z.uuid(),
});
export type ApproveOrganizationMemberInput = z.infer<
  typeof approveOrganizationMemberSchema
>;

export const updateOrganizationMemberRoleSchema = z.object({
  membershipId: z.uuid(),
  role: organizationRoleSchema,
});
export type UpdateOrganizationMemberRoleInput = z.infer<
  typeof updateOrganizationMemberRoleSchema
>;

export const removeOrganizationMemberSchema = z.object({
  membershipId: z.uuid(),
});
export type RemoveOrganizationMemberInput = z.infer<
  typeof removeOrganizationMemberSchema
>;

export const listOrganizationMembersSchema = z.object({
  organizationId: z.uuid(),
  includeInactive: z.boolean().optional(),
});
export type ListOrganizationMembersInput = z.infer<typeof listOrganizationMembersSchema>;

export const listDelegatedAccessSchema = z.object({
  organizationId: z.uuid(),
});
export type ListDelegatedAccessInput = z.infer<typeof listDelegatedAccessSchema>;

export const createDelegatedAccessSchema = z.object({
  organizationId: z.uuid(),
  delegateUserId: z.string().min(1, "Delegate user is required"),
  scope: delegatedAccessScopeSchema,
  expiresAt: z.iso.datetime().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type CreateDelegatedAccessInput = z.infer<typeof createDelegatedAccessSchema>;

export const revokeDelegatedAccessSchema = z.object({
  accessId: z.uuid(),
  notes: z.string().trim().max(500).optional(),
});
export type RevokeDelegatedAccessInput = z.infer<typeof revokeDelegatedAccessSchema>;
