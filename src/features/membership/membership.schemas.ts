import { z } from "zod";

// Query schemas
export const getMembershipTypeSchema = z.object({
  membershipTypeId: z.string(),
});
export type GetMembershipTypeInput = z.infer<typeof getMembershipTypeSchema>;

// Mutation schemas
export const purchaseMembershipSchema = z.object({
  membershipTypeId: z.string(),
  autoRenew: z.boolean().prefault(false),
});
export type PurchaseMembershipInput = z.infer<typeof purchaseMembershipSchema>;

export const cancelMembershipSchema = z.object({
  membershipId: z.string(),
  reason: z.string().optional(),
  immediate: z.boolean().prefault(false),
});
export type CancelMembershipInput = z.infer<typeof cancelMembershipSchema>;

export const confirmMembershipPurchaseSchema = z.object({
  membershipTypeId: z.string(),
  sessionId: z.string(),
  paymentId: z.string().optional(),
});
export type ConfirmMembershipPurchaseInput = z.infer<
  typeof confirmMembershipPurchaseSchema
>;
