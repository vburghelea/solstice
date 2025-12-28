import { z } from "zod";

export const joinRequestRoleSchema = z.enum(["reporter", "viewer", "member"]);

export const joinRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "denied",
  "cancelled",
]);

export const listDiscoverableOrganizationsSchema = z
  .object({
    search: z.string().trim().min(1).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const listMyJoinRequestsSchema = z
  .object({
    status: joinRequestStatusSchema.optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const listOrganizationJoinRequestsSchema = z.object({
  organizationId: z.uuid(),
  status: joinRequestStatusSchema.optional(),
});

export const createJoinRequestSchema = z.object({
  organizationId: z.uuid(),
  message: z.string().trim().max(500).optional(),
  requestedRole: joinRequestRoleSchema.optional(),
});

export const resolveJoinRequestSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["approved", "denied"]),
  resolutionNotes: z.string().trim().max(500).optional(),
});

export const cancelJoinRequestSchema = z.object({
  requestId: z.uuid(),
});

export const updateOrganizationAccessSchema = z.object({
  organizationId: z.uuid(),
  isDiscoverable: z.boolean().optional(),
  joinRequestsEnabled: z.boolean().optional(),
});
