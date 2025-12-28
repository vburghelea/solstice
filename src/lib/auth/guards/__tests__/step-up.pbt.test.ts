import { fc, test as fcTest } from "@fast-check/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTypedServerError } from "~/lib/server/errors";
import { requireRecentAuth } from "../step-up";

const REAUTH_WINDOW_MS = 15 * 60 * 1000;

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
  mockDb.limit.mockResolvedValue([record]);
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

const makeSession = (createdAt: Date, lastMfaVerifiedAt?: Date) => ({
  session: { createdAt, lastMfaVerifiedAt },
});

describe("requireRecentAuth property tests", () => {
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

  fcTest.prop([fc.integer({ min: 0, max: REAUTH_WINDOW_MS - 1 })])(
    "recent auth always passes",
    async (ageMs) => {
      setUserRecord({ mfaRequired: false, twoFactorEnabled: false });
      const createdAt = new Date(Date.now() - ageMs);

      await expect(
        requireRecentAuth("user-1", makeSession(createdAt)),
      ).resolves.toBeUndefined();
    },
  );

  fcTest.prop([fc.integer({ min: REAUTH_WINDOW_MS + 1, max: 86_400_000 })])(
    "stale auth always fails",
    async (ageMs) => {
      setUserRecord({ mfaRequired: false, twoFactorEnabled: false });
      const createdAt = new Date(Date.now() - ageMs);

      await expectReason(
        requireRecentAuth("user-1", makeSession(createdAt)),
        "REAUTH_REQUIRED",
      );
    },
  );

  fcTest.prop([
    fc.integer({ min: 0, max: REAUTH_WINDOW_MS - 1 }),
    fc.integer({ min: 0, max: REAUTH_WINDOW_MS - 1 }),
  ])("MFA users need both timestamps fresh", async (authAgeMs, mfaAgeMs) => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: true });
    const createdAt = new Date(Date.now() - authAgeMs);
    const lastMfaVerifiedAt = new Date(Date.now() - mfaAgeMs);

    await expect(
      requireRecentAuth("user-1", makeSession(createdAt, lastMfaVerifiedAt)),
    ).resolves.toBeUndefined();
  });

  it("treats the boundary as valid", async () => {
    setUserRecord({ mfaRequired: false, twoFactorEnabled: false });
    const createdAt = new Date(Date.now() - REAUTH_WINDOW_MS);

    await expect(
      requireRecentAuth("user-1", makeSession(createdAt)),
    ).resolves.toBeUndefined();
  });
});
