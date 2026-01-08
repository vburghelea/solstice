/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "viewer", name: "Viewer", email: "v@x" })),
}));
vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => makeDb()),
}));
vi.mock("~/db/schema", () => ({
  user: {
    id: "user.id",
    name: "user.name",
    email: "user.email",
    image: "user.image",
    uploadedAvatarPath: "user.uploadedAvatarPath",
    privacySettings: "user.privacySettings",
  },
  userBlocks: {
    id: "user_blocks.id",
    blockerId: "user_blocks.blocker_id",
    blockeeId: "user_blocks.blockee_id",
    reason: "user_blocks.reason",
    createdAt: "user_blocks.created_at",
  },
}));
vi.mock("../relationship.server", () => ({
  getRelationship: vi.fn(async () => ({
    follows: true,
    followedBy: false,
    blocked: false,
    blockedBy: false,
    isConnection: true,
  })),
}));
vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => {
    void args;
    return {};
  },
  desc: (...args: unknown[]) => {
    void args;
    return {};
  },
  sql: (lits: TemplateStringsArray) => String(lits),
}));
// Simplify TanStack server function wrapper for unit tests
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (h: unknown) => h,
    }),
  }),
}));

function makeDb() {
  const select = () => ({
    from: (...args: unknown[]) => ({
      where: (...args2: unknown[]) => ({
        limit: (...args3: unknown[]) => {
          void args;
          void args2;
          void args3;
          return [
            {
              id: "target",
              name: "Target",
              email: "t@x",
              image: null,
              uploadedAvatarPath: null,
            },
          ];
        },
      }),
    }),
  });
  return {
    select,
    query: {},
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  } as unknown;
}

describe("social.queries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getRelationshipSnapshot returns relationship and target", async () => {
    const { getRelationshipSnapshot } = await import("../social.queries");
    const result = await getRelationshipSnapshot({ data: { userId: "target" } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetUser.id).toBe("target");
    }
  });

  it("getBlocklist returns items with count", async () => {
    // Override getDb to return a DB with tailored select chains for blocklist
    const helpers = await import("~/db/server-helpers");
    (helpers.getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      select: (sel?: unknown) => {
        // First select is count
        if (sel && typeof sel === "object" && "count" in (sel as Record<string, unknown>))
          return { from: () => ({ where: () => [{ count: 2 }] }) };
        // Second select returns rows
        return {
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                orderBy: () => ({
                  limit: () => ({
                    offset: () => [
                      {
                        block: { id: "b1", reason: null, createdAt: new Date() },
                        blocked: {
                          id: "u2",
                          name: "User Two",
                          email: "u2@x",
                          image: null,
                          uploadedAvatarPath: null,
                        },
                      },
                    ],
                  }),
                }),
              }),
            }),
          }),
        };
      },
    } as unknown);

    const { getBlocklist } = await import("../social.queries");
    const result = await getBlocklist({ data: { page: 1, pageSize: 10 } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(2);
      expect(result.data.items.length).toBe(1);
    }
  });
});
