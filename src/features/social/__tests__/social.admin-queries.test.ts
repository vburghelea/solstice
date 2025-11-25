/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "admin-user" })),
}));

vi.mock("~/features/roles/permission.service", () => ({
  PermissionService: { isGlobalAdmin: vi.fn(async () => true) },
}));

// Simplify server function wrapper
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: (h: unknown) => h }),
  }),
  createServerOnlyFn: (fn: () => unknown) => fn(),
}));

// Fake DB layer
const orderByMock = vi.fn(() => ({
  limit: vi.fn(() => ({ offset: vi.fn(() => Promise.resolve([])) })),
}));
const leftJoinMock = vi.fn();
const baseFrom = {
  where: vi.fn(() => ({ orderBy: orderByMock })),
  leftJoin: leftJoinMock,
};

vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => ({
    select: (sel?: unknown) => ({
      from: () => {
        // For count(*) query, return an array shape
        const hasCount =
          !!sel &&
          typeof sel === "object" &&
          sel !== null &&
          "count" in (sel as Record<string, unknown>);
        if (hasCount) {
          return { where: () => Promise.resolve([{ count: 0 }]) };
        }
        // For rows query, return chain
        return baseFrom as unknown as {
          where: () => unknown;
          leftJoin: (...args: unknown[]) => unknown;
        };
      },
    }),
  })),
}));

vi.mock("~/db/schema", () => ({
  socialAuditLogs: {
    createdAt: {},
    action: {},
    actorUserId: {},
    targetUserId: {},
    id: {},
    metadata: {},
  },
  user: {
    id: {},
    name: {},
    email: {},
    as: (n: string) => ({ id: {}, name: {}, email: {}, _alias: n }),
  },
}));

describe("social.admin-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns FORBIDDEN when user is not admin", async () => {
    const roles = await import("~/features/roles/permission.service");
    (
      roles.PermissionService.isGlobalAdmin as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(false);
    const { getSocialAudits } = await import("../social.admin-queries");
    const result = (await getSocialAudits({ data: { page: 1, pageSize: 10 } })) as {
      success: boolean;
      errors?: { code: string }[];
    };
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
    }
  });

  it("returns success for admin with empty rows", async () => {
    const { getSocialAudits } = await import("../social.admin-queries");
    const result = (await getSocialAudits({ data: { page: 1, pageSize: 10 } })) as {
      success: boolean;
      data?: { items: unknown[]; totalCount: number };
    };
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(typeof result.data.totalCount).toBe("number");
    }
  });
});
