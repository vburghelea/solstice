import { z } from "zod";

export const inviteLinkRoleSchema = z.enum(["reporter", "viewer", "member"]);

export const createInviteLinkSchema = z.object({
  organizationId: z.uuid(),
  role: inviteLinkRoleSchema.optional(),
  autoApprove: z.boolean().optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const listInviteLinksSchema = z.object({
  organizationId: z.uuid(),
  includeRevoked: z.boolean().optional(),
});

export const revokeInviteLinkSchema = z.object({
  linkId: z.uuid(),
});

export const redeemInviteLinkSchema = z.object({
  token: z.string().min(1),
});
