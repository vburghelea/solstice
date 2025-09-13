/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "viewer" })),
}));
vi.mock("~/db/server-helpers", () => ({
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
  findGameById: vi.fn(async (id: string) => ({
    id,
    ownerId: "owner",
    visibility: "public",
    status: "scheduled",
  })),
  findGameParticipantById: vi.fn(async () => null),
  findPendingGameApplicationsByGameId: vi.fn(async () => []),
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
const getRelationship = vi.fn(async (): Promise<RelationshipState> => relationshipState);
const canInvite = vi.fn(async () => false);
vi.mock("~/features/social/relationship.server", () => ({ getRelationship, canInvite }));

// Mock env.server in case db/connections is touched indirectly
vi.mock("~/lib/env.server", () => ({
  getUnpooledDbUrl: () => "postgres://user:pass@localhost:5432/db",
  isServerless: () => false,
}));

// Simplify TanStack server function wrapper and serverOnly for unit tests
vi.mock("@tanstack/react-start", () => ({
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
  });

  it.skip("applyToGame rejects when blocked any direction", async () => {
    const repo = await import("~/features/games/games.repository");
    (repo.findGameById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g1",
      ownerId: "owner",
      visibility: "public",
      status: "scheduled",
    });
    // Force blocked state via shared state
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    const { applyToGame } = await import("../games.mutations");
    const result = await applyToGame({ data: { gameId: "g1" } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
    }
  });

  it.skip("applyToGame rejects on protected when not a connection", async () => {
    const repo = await import("~/features/games/games.repository");
    (repo.findGameById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g2",
      ownerId: "owner",
      visibility: "protected",
      status: "scheduled",
    });
    // Force non-connection state
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    const { applyToGame } = await import("../games.mutations");
    const result = await applyToGame({ data: { gameId: "g2" } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
    }
  });

  it("addGameParticipant rejects when blocked any direction", async () => {
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    // Owner is the current user in this test
    const auth = await import("~/features/auth/auth.queries");
    (auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "owner",
    });
    const repo = await import("~/features/games/games.repository");
    (repo.findGameById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g3",
      ownerId: "owner",
      visibility: "public",
      status: "scheduled",
    });
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
    const repo = await import("~/features/games/games.repository");
    (repo.findGameById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "g4",
      ownerId: "owner",
      visibility: "public",
      status: "scheduled",
    });
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
      const repo = await import("~/features/games/games.repository");
      (repo.findGameById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "g5",
        ownerId: "owner",
        visibility: "public",
        status,
      });
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
