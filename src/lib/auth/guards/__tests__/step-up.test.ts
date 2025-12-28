import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTypedServerError } from "~/lib/server/errors";
import { requireRecentAuth } from "../step-up";

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};

const getDb = vi.fn();

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDb(...args),
}));

vi.mock("~/db/schema", () => ({
  user: {
    id: "id",
    mfaRequired: "mfaRequired",
    twoFactorEnabled: "twoFactorEnabled",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const setUserRecord = (record: { mfaRequired: boolean; twoFactorEnabled: boolean }) => {
  mockDb.limit.mockResolvedValueOnce([record]);
};

const expectReason = async (promise: Promise<unknown>, reason: string) => {
  try {
    await promise;
    throw new Error("Expected requireRecentAuth to throw");
  } catch (error) {
    expect(isTypedServerError(error)).toBe(true);
    if (isTypedServerError(error)) {
      expect(error.error.details?.["reason"]).toBe(reason);
    }
  }
};

describe("requireRecentAuth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockReset();
    getDb.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("fails closed when authenticatedAt is missing", async () => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: false });

    await expectReason(requireRecentAuth("user-1", { session: {} }), "REAUTH_REQUIRED");
  });

  it("rejects when session exceeds re-auth window", async () => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: false });

    const createdAt = new Date(Date.now() - 16 * 60 * 1000);

    await expectReason(
      requireRecentAuth("user-1", { session: { createdAt } }),
      "REAUTH_REQUIRED",
    );
  });

  it("requires MFA re-verification when MFA timestamp is missing", async () => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: true });

    const createdAt = new Date(Date.now() - 2 * 60 * 1000);

    await expectReason(
      requireRecentAuth("user-1", { session: { createdAt } }),
      "MFA_REVERIFY_REQUIRED",
    );
  });

  it("rejects when MFA is required but not enabled", async () => {
    setUserRecord({ mfaRequired: true, twoFactorEnabled: false });

    const createdAt = new Date(Date.now() - 2 * 60 * 1000);

    await expectReason(
      requireRecentAuth("user-1", { session: { createdAt } }),
      "MFA_REQUIRED",
    );
  });

  it("allows recent sessions with recent MFA verification", async () => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: true });

    const createdAt = new Date(Date.now() - 2 * 60 * 1000);
    const lastMfaVerifiedAt = new Date(Date.now() - 1 * 60 * 1000);

    await expect(
      requireRecentAuth("user-1", { session: { createdAt, lastMfaVerifiedAt } }),
    ).resolves.toBeUndefined();
  });
});
