/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Do not mock createServerFn; call internal helper instead

vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        // Main query chain
        innerJoin: () => ({
          innerJoin: () => ({
            leftJoin: () => ({
              where: () => ({ groupBy: () => Promise.resolve([]) }),
            }),
          }),
        }),
        // Subquery path used in IN (...) clause
        where: () => ({}),
      }),
    }),
  })),
}));
vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "viewer" })),
}));

describe("listCampaigns internal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success for authenticated user", async () => {
    const mod = await import("../campaigns.queries");
    const res = await mod.listCampaignsInternal({});
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
  });

  it("returns success for unauthenticated user", async () => {
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null,
    );
    const mod = await import("../campaigns.queries");
    const res = await mod.listCampaignsInternal({});
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
  });
});
