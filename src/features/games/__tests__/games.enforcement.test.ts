/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const gameStore: Record<string, unknown> = {};

vi.mock("~/features/auth/auth.queries", () => ({
  __esModule: true,
  getCurrentUser: vi.fn(async () => ({ id: "viewer" })),
}));
vi.mock("~/db/server-helpers", () => ({
  __esModule: true,
  getDb: vi.fn(async () => ({
    query: {
      gameApplications: { findFirst: vi.fn(async () => null) },
      gameParticipants: { findFirst: vi.fn(async () => null) },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: "row1" }]) })),
    })),
    delete: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
  })),
}));

// Mock repository to return a minimal game object as needed by mutations
vi.mock("~/features/games/games.repository", () => ({
  __esModule: true,
  findGameById: vi.fn(
    async (id: string) =>
      (gameStore[id] as Record<string, unknown>) ?? {
        id,
        ownerId: "owner",
        visibility: "public",
        status: "scheduled",
      },
  ),
  findGameParticipantById: vi.fn(async () => null),
  findPendingGameApplicationsByGameId: vi.fn(async () => []),
  findGameApplicationById: vi.fn(async () => ({ id: "ga1" })),
}));

// Relationship server mock using shared mutable state
interface RelationshipState {
  blocked: boolean;
  blockedBy: boolean;
  isConnection: boolean;
}

let relationshipState: RelationshipState = {
  blocked: false,
  blockedBy: false,
  isConnection: false,
};
const getRelationship = vi.fn(async (...args: string[]): Promise<RelationshipState> => {
  void args;
  return relationshipState;
});
const canInvite = vi.fn(async (...args: string[]) => {
  void args;
  return true;
});
vi.mock("~/features/social/relationship.server", () => ({
  __esModule: true,
  getRelationship,
  canInvite,
}));

// Mock env.server in case db/connections is touched indirectly
vi.mock("~/lib/env.server", () => ({
  __esModule: true,
  getUnpooledDbUrl: () => "postgres://user:pass@localhost:5432/db",
  isServerless: () => false,
}));

// Simplify TanStack server function wrapper and serverOnly for unit tests
vi.mock("@tanstack/react-start", () => ({
  __esModule: true,
  createServerFn: () => ({
    validator: () => ({
      handler: (h: unknown) => h,
    }),
  }),
  serverOnly: (fn: unknown) => fn,
}));

describe("games social enforcement", () => {
  beforeEach(() => {
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    getRelationship.mockClear();
    canInvite.mockClear();
    Object.keys(gameStore).forEach((key) => delete gameStore[key]);
  });

  it("applyToGame rejects when blocked any direction", async () => {
    const { enforceApplyEligibility } = await import(
      "~/features/social/enforcement.helpers"
    );
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    const result = await enforceApplyEligibility({
      viewerId: "viewer",
      ownerId: "owner",
      visibility: "public",
      getRelationship,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("applyToGame rejects on protected when not a connection", async () => {
    const { enforceApplyEligibility } = await import(
      "~/features/social/enforcement.helpers"
    );
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    const result = await enforceApplyEligibility({
      viewerId: "viewer",
      ownerId: "owner",
      visibility: "protected",
      getRelationship,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("addGameParticipant rejects when blocked any direction", async () => {
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    // Owner is the current user in this test
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "owner",
    });
    gameStore["g3"] = {
      id: "g3",
      ownerId: "owner",
      visibility: "public",
      status: "scheduled",
    };
    const { addGameParticipant } = await import("../games.mutations");
    const result = await addGameParticipant({
      data: { gameId: "g3", userId: "target", role: "invited", status: "pending" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
    }
  });

  it("addGameParticipant rejects when invitee only accepts connections", async () => {
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "owner",
    });
    gameStore["g4"] = {
      id: "g4",
      ownerId: "owner",
      visibility: "public",
      status: "scheduled",
    };
    canInvite.mockResolvedValueOnce(false);
    const { addGameParticipant } = await import("../games.mutations");
    const result = await addGameParticipant({
      data: { gameId: "g4", userId: "target", role: "invited", status: "pending" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
    }
  });

  it.each(["canceled", "completed"])(
    "addGameParticipant rejects for %s games",
    async (status) => {
      const auth = await import("~/features/auth/auth.queries");
      (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "owner",
      });
      gameStore["g5"] = {
        id: "g5",
        ownerId: "owner",
        visibility: "public",
        status,
      };
      const { addGameParticipant } = await import("../games.mutations");
      const result = await addGameParticipant({
        data: { gameId: "g5", userId: "target", role: "invited", status: "pending" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors?.[0]?.code).toBe("CONFLICT");
      }
    },
  );
});
