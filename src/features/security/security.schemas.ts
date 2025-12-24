import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const recordSecurityEventSchema = z.object({
  userId: z.string().optional(),
  identifier: z.string().optional(),
  eventType: z.string().min(1),
  metadata: jsonRecordSchema.optional(),
});
export type RecordSecurityEventInput = z.infer<typeof recordSecurityEventSchema>;

export const lockUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(1),
  unlockAt: z.iso.datetime().optional(),
  metadata: jsonRecordSchema.optional(),
});
export type LockUserInput = z.infer<typeof lockUserSchema>;

export const unlockUserSchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});
export type UnlockUserInput = z.infer<typeof unlockUserSchema>;

export const accountLockStatusSchema = z.object({
  userId: z.string(),
});
export type AccountLockStatusInput = z.infer<typeof accountLockStatusSchema>;
