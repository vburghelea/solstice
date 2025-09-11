/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/auth/auth.queries", () => ({
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
const getRelationship = vi.fn(async (): Promise<RelationshipState> => relationshipState);
const canInvite = vi.fn(async () => false);
vi.mock("~/features/social/relationship.server", () => ({ getRelationship, canInvite }));

// DB helpers minimal mock with controllable select/insert behavior
let dbState: {
  existingParticipant: unknown | null;
  insertReturning: Array<{ id: string }>;
} = {
  existingParticipant: null,
  insertReturning: [{ id: "row1" }],
};
vi.mock("~/db/server-helpers", () => ({
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

// Repository mocks
vi.mock("~/features/campaigns/campaigns.repository", () => ({
  findCampaignById: vi.fn(async (id: string) => ({
    id,
    ownerId: "owner",
    visibility: "public",
    status: "ongoing",
  })),
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
  getAuth: vi.fn(async () => ({
    api: { signUpEmail: vi.fn(async () => ({ user: null })) },
  })),
}));

// Simplify server wrappers
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ validator: () => ({ handler: (h: unknown) => h }) }),
}));

describe("campaigns social enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    dbState = { existingParticipant: null, insertReturning: [{ id: "row1" }] };
  });

  it.skip("applyToCampaign rejects when blocked any direction", async () => {
    const repo = await import("~/features/campaigns/campaigns.repository");
    (repo.findCampaignById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "c1",
      ownerId: "owner",
      visibility: "public",
      status: "ongoing",
    });
    // Drive relationship via shared state in the mock implementation
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    const { applyToCampaign } = await import("../campaigns.mutations");
    const result = await applyToCampaign({ data: { campaignId: "c1" } });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
  });

  it.skip("applyToCampaign rejects on protected when not a connection", async () => {
    const repo = await import("~/features/campaigns/campaigns.repository");
    (repo.findCampaignById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "c2",
      ownerId: "owner",
      visibility: "protected",
      status: "ongoing",
    });
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    const { applyToCampaign } = await import("../campaigns.mutations");
    const result = await applyToCampaign({ data: { campaignId: "c2" } });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
  });

  it.skip("inviteToCampaign rejects when blocked any direction", async () => {
    const repo = await import("~/features/campaigns/campaigns.repository");
    (repo.findCampaignById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "c3",
      ownerId: "viewer", // current user is owner in this test
      visibility: "public",
      status: "ongoing",
    });
    relationshipState = { blocked: true, blockedBy: false, isConnection: false };
    const { inviteToCampaign } = await import("../campaigns.mutations");
    const result = await inviteToCampaign({
      data: { campaignId: "c3", email: "u2@example.com", role: "invited" },
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
  });

  it.skip("inviteToCampaign rejects when invitee only accepts connections", async () => {
    const repo = await import("~/features/campaigns/campaigns.repository");
    (repo.findCampaignById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "c4",
      ownerId: "viewer",
      visibility: "public",
      status: "ongoing",
    });
    relationshipState = { blocked: false, blockedBy: false, isConnection: false };
    const rel = await import("~/features/social/relationship.server");
    (rel.canInvite as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const { inviteToCampaign } = await import("../campaigns.mutations");
    const result = await inviteToCampaign({
      data: { campaignId: "c4", email: "u2@example.com", role: "invited" },
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.[0]?.code).toBe("FORBIDDEN");
  });
});
