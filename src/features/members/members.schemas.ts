import { z } from "zod";

export const listMembersSchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListMembersInput = z.infer<typeof listMembersSchema>;
