import { z } from "zod";

export const listMembersSchema = z.object({
  search: z.string().optional(),
  limit: z.int().min(1).max(100).optional().prefault(50),
  offset: z.int().min(0).optional().prefault(0),
});

export type ListMembersInput = z.infer<typeof listMembersSchema>;
