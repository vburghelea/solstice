import { z } from "zod";

// Query schemas
export const getTeamSchema = z.object({
  teamId: z.string(),
});
export type GetTeamInput = z.infer<typeof getTeamSchema>;

export const getTeamBySlugSchema = z.object({
  slug: z.string(),
});
export type GetTeamBySlugInput = z.infer<typeof getTeamBySlugSchema>;

const listTeamsInputSchema = z.object({
  includeInactive: z.boolean().optional().prefault(false),
});

export const listTeamsSchema = listTeamsInputSchema
  .nullish()
  .transform((value) => value ?? { includeInactive: false });
export type ListTeamsInput = z.infer<typeof listTeamsSchema>;

export const getTeamMembersSchema = z.object({
  teamId: z.string(),
  includeInactive: z.boolean().optional(),
});
export type GetTeamMembersInput = z.infer<typeof getTeamMembersSchema>;

export const isTeamMemberSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});
export type IsTeamMemberInput = z.infer<typeof isTeamMemberSchema>;

export const searchTeamsSchema = z.object({
  query: z.string().min(1),
});
export type SearchTeamsInput = z.infer<typeof searchTeamsSchema>;

// Mutation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  slug: z
    .string()
    .min(1, "A unique URL slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  foundedYear: z.string().length(4).optional(),
  website: z.url().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  teamId: z.string(),
  data: createTeamSchema.partial(),
});
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const addTeamMemberSchema = z.object({
  teamId: z.string(),
  email: z.email("Please enter a valid email address"),
  role: z.enum(["captain", "coach", "player", "substitute"]),
  jerseyNumber: z.string().optional(),
  position: z.string().optional(),
});
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

export const updateTeamMemberSchema = z.object({
  teamId: z.string(),
  memberId: z.string(),
  role: z.enum(["captain", "coach", "player", "substitute"]).optional(),
  jerseyNumber: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

export const removeTeamMemberSchema = z.object({
  teamId: z.string(),
  memberId: z.string(),
});
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;

export const teamInviteActionSchema = z.object({
  teamId: z.string(),
});
export type TeamInviteActionInput = z.infer<typeof teamInviteActionSchema>;

export const requestTeamMembershipSchema = z.object({
  teamId: z.string(),
});
export type RequestTeamMembershipInput = z.infer<typeof requestTeamMembershipSchema>;
