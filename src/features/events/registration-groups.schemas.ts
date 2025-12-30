import { z } from "zod";

export const registrationGroupTypeSchema = z.enum([
  "individual",
  "pair",
  "team",
  "relay",
  "family",
]);

export const registrationGroupStatusSchema = z.enum([
  "draft",
  "pending",
  "confirmed",
  "cancelled",
]);

export const registrationGroupMemberStatusSchema = z.enum([
  "invited",
  "pending",
  "active",
  "declined",
  "removed",
]);

export const registrationGroupMemberRoleSchema = z.enum(["captain", "member"]);

export const createRegistrationGroupSchema = z.object({
  eventId: z.uuid(),
  groupType: registrationGroupTypeSchema,
  teamId: z.string().optional(),
  minSize: z.int().positive().optional(),
  maxSize: z.int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateRegistrationGroupSchema = z.object({
  groupId: z.uuid(),
  data: z.object({
    status: registrationGroupStatusSchema.optional(),
    minSize: z.int().positive().optional(),
    maxSize: z.int().positive().optional(),
    teamId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const getRegistrationGroupSchema = z.object({
  groupId: z.uuid(),
});

export const listRegistrationGroupsSchema = z.object({
  eventId: z.uuid(),
});

export const listRegistrationGroupMembersSchema = z.object({
  groupId: z.uuid(),
});

export const inviteRegistrationGroupMemberSchema = z.object({
  groupId: z.uuid(),
  email: z.email("Please enter a valid email address"),
  role: registrationGroupMemberRoleSchema.optional().prefault("member"),
  expiresAt: z.iso.datetime().optional(),
});

export const acceptRegistrationInviteSchema = z.object({
  token: z.string().min(1),
});

export const declineRegistrationInviteSchema = z.object({
  token: z.string().min(1),
});

export const revokeRegistrationInviteSchema = z.object({
  inviteId: z.uuid(),
});

export const removeRegistrationGroupMemberSchema = z.object({
  groupMemberId: z.uuid(),
});

export const getRegistrationInvitePreviewSchema = z.object({
  token: z.string().min(1),
});
