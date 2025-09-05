import type { Relationship } from "./relationship.server";

export type RelationshipSnapshot = Relationship & {
  targetUser: { id: string; name: string; email: string; image?: string | null };
};

export interface BlocklistItem {
  id: string; // block id
  user: { id: string; name: string; email: string; image?: string | null };
  reason?: string | null;
  createdAt: Date;
}
