import { serverOnly } from "@tanstack/react-start";

type Relationship = {
  follows: boolean; // viewer → target
  followedBy: boolean; // target → viewer
  blocked: boolean; // viewer blocks target
  blockedBy: boolean; // target blocks viewer
  isConnection: boolean; // either follow direction or active teammates
};

// Simple TTL cache (module-scoped)
const REL_CACHE_TTL_MS = 60_000;
const relCache = new Map<string, { value: Relationship; expires: number }>();

const getDb = serverOnly(async () => {
  const { db } = await import("~/db");
  return db();
});

function cacheKey(viewerId: string, targetId: string): string {
  return `${viewerId}::${targetId}`;
}

function setCache(viewerId: string, targetId: string, value: Relationship) {
  relCache.set(cacheKey(viewerId, targetId), {
    value,
    expires: Date.now() + REL_CACHE_TTL_MS,
  });
}

function getCache(viewerId: string, targetId: string): Relationship | null {
  const entry = relCache.get(cacheKey(viewerId, targetId));
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    relCache.delete(cacheKey(viewerId, targetId));
    return null;
  }
  return entry.value;
}

export function invalidateRelationshipCache(viewerId: string, targetId: string): void {
  relCache.delete(cacheKey(viewerId, targetId));
  relCache.delete(cacheKey(targetId, viewerId));
}

export const getRelationship = serverOnly(
  async (viewerId: string, targetId: string): Promise<Relationship> => {
    if (!viewerId || !targetId) {
      return {
        follows: false,
        followedBy: false,
        blocked: false,
        blockedBy: false,
        isConnection: false,
      };
    }

    // Self relationship shortcut
    if (viewerId === targetId) {
      return {
        follows: true,
        followedBy: true,
        blocked: false,
        blockedBy: false,
        isConnection: true,
      };
    }

    const cached = getCache(viewerId, targetId);
    if (cached) return cached;

    const db = await getDb();

    // Blocks any direction
    const blockedRow = await db.query.userBlocks.findFirst({
      where: (b, { or, and, eq }) =>
        or(
          and(eq(b.blockerId, viewerId), eq(b.blockeeId, targetId)),
          and(eq(b.blockerId, targetId), eq(b.blockeeId, viewerId)),
        ),
    });

    // Follows viewer → target
    const followsRow = await db.query.userFollows.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.followerId, viewerId), eq(f.followingId, targetId)),
    });

    // Follows target → viewer
    const followedByRow = await db.query.userFollows.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.followerId, targetId), eq(f.followingId, viewerId)),
    });

    const [{ teamMembers }, { alias }] = await Promise.all([
      import("~/db/schema"),
      import("drizzle-orm/pg-core"),
    ]);
    const { and, eq } = await import("drizzle-orm");

    const teammateAlias = alias(teamMembers, "teammate");

    const sharedTeam = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .innerJoin(
        teammateAlias,
        and(
          eq(teamMembers.teamId, teammateAlias.teamId),
          eq(teammateAlias.userId, targetId),
          eq(teammateAlias.status, "active"),
        ),
      )
      .where(and(eq(teamMembers.userId, viewerId), eq(teamMembers.status, "active")))
      .limit(1);

    const rel: Relationship = {
      follows: !!followsRow,
      followedBy: !!followedByRow,
      blocked: !!blockedRow && blockedRow.blockerId === viewerId,
      blockedBy: !!blockedRow && blockedRow.blockerId === targetId,
      isConnection: !!(followsRow || followedByRow || sharedTeam.length > 0),
    };

    setCache(viewerId, targetId, rel);
    return rel;
  },
);

export const assertNoBlock = serverOnly(async (viewerId: string, targetId: string) => {
  const rel = await getRelationship(viewerId, targetId);
  if (rel.blocked || rel.blockedBy) {
    const error: Error & { code?: string } = new Error("Interaction not allowed");
    error.code = "BLOCKED";
    throw error;
  }
});

export const isConnectionsOnlyEligible = serverOnly(
  async (viewerId: string | null | undefined, ownerId: string): Promise<boolean> => {
    if (!viewerId) return false;
    const rel = await getRelationship(viewerId, ownerId);
    if (rel.blocked || rel.blockedBy) return false;
    return rel.isConnection;
  },
);

type PrivacySettings = {
  allowInvitesOnlyFromConnections?: boolean;
};

async function getUserPrivacySettings(userId: string): Promise<PrivacySettings> {
  const db = await getDb();
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const [row] = await db
    .select({ privacySettings: user.privacySettings })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row?.privacySettings) return {};
  try {
    const parsed = JSON.parse(row.privacySettings) as PrivacySettings;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export const canInvite = serverOnly(
  async (inviterId: string, inviteeId: string): Promise<boolean> => {
    if (!inviterId || !inviteeId) return false;
    const rel = await getRelationship(inviterId, inviteeId);
    if (rel.blocked || rel.blockedBy) return false;

    const privacy = await getUserPrivacySettings(inviteeId);
    const requiresConnection = !!privacy.allowInvitesOnlyFromConnections;
    if (!requiresConnection) return true;

    return rel.isConnection;
  },
);

export type { Relationship };
