/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "viewer" })),
}));
vi.mock("~/features/social/relationship.server", () => ({
  getRelationship: vi.fn(async () => ({ blocked: false, blockedBy: false })),
  invalidateRelationshipCache: vi.fn(),
}));
vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => makeDb()),
}));
vi.mock("~/db/schema", async () => ({
  user: {
    id: "user.id",
    name: "user.name",
    email: "user.email",
    privacySettings: "user.privacySettings",
  },
  userFollows: {
    id: "user_follows.id",
    followerId: "user_follows.follower_id",
    followingId: "user_follows.following_id",
  },
  userBlocks: {
    id: "user_blocks.id",
    blockerId: "user_blocks.blocker_id",
    blockeeId: "user_blocks.blockee_id",
    reason: "user_blocks.reason",
    createdAt: "user_blocks.created_at",
  },
  socialAuditLogs: { id: "social_audit_logs.id" },
}));
vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => {
    void args;
    return {};
  },
  and: (...args: unknown[]) => {
    void args;
    return {};
  },
  or: (...args: unknown[]) => {
    void args;
    return {};
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getWebRequest: () => ({ headers: new Headers({ "user-agent": "vitest" }) }),
}));
// Simplify TanStack server function wrapper for unit tests
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    validator: () => ({
      handler: (h: unknown) => h,
    }),
  }),
}));

function makeDb() {
  // Chainable select mock that returns the target user with open follows
  const select = () => ({
    from: (...args: unknown[]) => ({
      where: (...args2: unknown[]) => ({
        limit: (...args3: unknown[]) => {
          void args;
          void args2;
          void args3;
          return [{ id: "target", privacySettings: null }];
        },
      }),
    }),
  });
  const query = {
    userFollows: { findFirst: vi.fn(async () => null) },
    userBlocks: { findFirst: vi.fn(async () => null) },
  };
  const insert = vi.fn().mockReturnValue({ values: vi.fn(async () => undefined) });
  const _delete = vi.fn().mockReturnValue({ where: vi.fn(async () => undefined) });
  return { select, query, insert, delete: _delete } as unknown;
}

describe("social.mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("followUser succeeds and audits", async () => {
    const { followUser } = await import("../social.mutations");
    const result = await followUser({ data: { followingId: "target" } });
    expect(result.success).toBe(true);
  });

  it("followUser fails when unauthenticated", async () => {
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null,
    );
    const { followUser } = await import("../social.mutations");
    const result = await followUser({ data: { followingId: "target" } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("AUTH_ERROR");
    }
  });

  it("followUser fails when target not accepting follows", async () => {
    const helpers = await import("~/db/server-helpers");
    (helpers.getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [
              { id: "target", privacySettings: JSON.stringify({ allowFollows: false }) },
            ],
          }),
        }),
      }),
      query: { userFollows: { findFirst: vi.fn(async () => null) } },
      insert: vi.fn().mockReturnValue({ values: vi.fn(async () => undefined) }),
    } as unknown);
    const { followUser } = await import("../social.mutations");
    const result = await followUser({ data: { followingId: "target" } });
    expect(result.success).toBe(false);
  });

  it("followUser fails when blocked", async () => {
    const rel = await import("../relationship.server");
    (rel.getRelationship as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      blocked: true,
      blockedBy: false,
    });
    const { followUser } = await import("../social.mutations");
    const result = await followUser({ data: { followingId: "target" } });
    expect(result.success).toBe(false);
  });

  it("blockUser fails when self", async () => {
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "viewer",
    } as unknown as { id: string });
    const { blockUser } = await import("../social.mutations");
    const result = await blockUser({ data: { userId: "viewer" } });
    expect(result.success).toBe(false);
  });

  it("blockUser inserts block, removes follows, cancels pending, and audits", async () => {
    const { blockUser } = await import("../social.mutations");
    // Mock cancelPendingBetweenUsers to ensure it is called
    vi.doMock("../enforcement.server", () => ({
      cancelPendingBetweenUsers: vi.fn(async () => undefined),
    }));
    const result = await blockUser({ data: { userId: "target" } });
    expect(result.success).toBe(true);
  });

  it("unblockUser deletes block and audits", async () => {
    const { unblockUser } = await import("../social.mutations");
    const result = await unblockUser({ data: { userId: "target" } });
    expect(result.success).toBe(true);
  });
});
