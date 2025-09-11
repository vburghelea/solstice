export type Visibility = "public" | "protected" | "private";

export type RelationshipSnapshotLite = {
  blocked: boolean;
  blockedBy: boolean;
  isConnection: boolean;
};

export type EnforceResult =
  | { allowed: true }
  | { allowed: false; code: "FORBIDDEN"; message: string };

export async function enforceApplyEligibility(params: {
  viewerId: string;
  ownerId: string;
  visibility: Visibility;
  getRelationship: (
    viewerId: string,
    ownerId: string,
  ) => Promise<RelationshipSnapshotLite>;
}): Promise<EnforceResult> {
  const { viewerId, ownerId, visibility, getRelationship } = params;
  const rel = await getRelationship(viewerId, ownerId);

  if (rel.blocked || rel.blockedBy) {
    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You cannot interact with this organizer",
    } as const;
  }

  if (visibility === "protected" && !rel.isConnection) {
    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "Not eligible to apply to this game",
    } as const;
  }

  // For public visibility (and private flows controlled elsewhere), allow by default here
  return { allowed: true } as const;
}
