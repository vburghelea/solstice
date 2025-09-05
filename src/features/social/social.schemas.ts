import { z } from "zod";

export const followInputSchema = z.object({
  followingId: z.string().min(1),
});

export const unfollowInputSchema = z.object({
  followingId: z.string().min(1),
});

export const blockInputSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const unblockInputSchema = z.object({
  userId: z.string().min(1),
});

export const relationshipInputSchema = z.object({
  userId: z.string().min(1),
});

export const getBlocklistInputSchema = z
  .object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
  })
  .optional();

export type FollowInput = z.infer<typeof followInputSchema>;
export type UnfollowInput = z.infer<typeof unfollowInputSchema>;
export type BlockInput = z.infer<typeof blockInputSchema>;
export type UnblockInput = z.infer<typeof unblockInputSchema>;
export type RelationshipInput = z.infer<typeof relationshipInputSchema>;
export type GetBlocklistInput = z.infer<typeof getBlocklistInputSchema>;
