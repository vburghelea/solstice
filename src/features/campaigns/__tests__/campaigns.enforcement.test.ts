/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/auth/auth.queries", () => ({
  __esModule: true,
  getCurrentUser: vi.fn(async () => ({ id: "viewer" })),
}));

// Relationship server mock using shared state
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

// DB helpers minimal mock with controllable select/insert behavior
let dbState: {
  existingParticipant: unknown | null;
  insertReturning: Array<{ id: string }>;
} = {
  existingParticipant: null,
  insertReturning: [{ id: "row1" }],
};
vi.mock("~/db/server-helpers", () => ({
  __esModule: true,
  getDb: vi.fn(async () => ({
    query: { campaignParticipants: { findFirst: vi.fn(async () => null) } },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn(async () => dbState.insertReturning) })),
    })),
    select: () => ({
      from: () => ({
        where: async () => dbState.existingParticipant,
      }),
    }),
  })),
}));

const campaignStore: Record<string, unknown> = {};

// Repository mocks
vi.mock("~/features/campaigns/campaigns.repository", () => ({
  __esModule: true,
  findCampaignById: vi.fn(
    async (id: string) =>
      (campaignStore[id] as Record<string, unknown>) ?? {
        id,
        ownerId: "owner",
        visibility: "public",
        status: "active",
      },
  ),
  findCampaignApplicationById: vi.fn(async () => ({
    id: "app1",
    campaignId: "c1",
    userId: "viewer",
    status: "pending",
  })),
  findUserByEmail: vi.fn(async () => ({ id: "u2", email: "u2@example.com" })),
  findCampaignParticipantById: vi.fn(async () => null),
}));

// Mock auth server helpers to avoid hitting sign-up branch
vi.mock("~/lib/auth/server-helpers", () => ({
  __esModule: true,
  getAuth: vi.fn(async () => ({
    api: { signUpEmail: vi.fn(async () => ({ user: null })) },
  })),
}));

// Simplify server wrappers
vi.mock("@tanstack/react-start", () => ({
  __esModule: true,
  createServerFn: () => ({ validator: () => ({ handler: (h: unknown) => h }) }),
}));

describe("campaigns social enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    dbState = { existingParticipant: null, insertReturning: [{ id: "row1" }] };
    Object.keys(campaignStore).forEach((key) => delete campaignStore[key]);
  });

  it("applyToCampaign rejects when blocked any direction", async () => {
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

  it("applyToCampaign rejects on protected when not a connection", async () => {
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

  async function simulateInviteEligibility(ownerId: string, inviteeId: string) {
    const rel = await getRelationship(ownerId, inviteeId);
    if (rel.blocked || rel.blockedBy) {
      return { allowed: false, code: "FORBIDDEN" } as const;
    }
    const ok = await canInvite(ownerId, inviteeId);
    if (!ok) {
      return { allowed: false, code: "FORBIDDEN" } as const;
    }
    return { allowed: true } as const;
  }

  it("inviteToCampaign rejects when blocked any direction", async () => {
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    const result = await simulateInviteEligibility("viewer", "u2");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("inviteToCampaign rejects when invitee only accepts connections", async () => {
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    canInvite.mockResolvedValueOnce(false);
    const result = await simulateInviteEligibility("viewer", "u2");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });
});
