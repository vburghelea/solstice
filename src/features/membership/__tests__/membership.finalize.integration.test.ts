import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MembershipDbClient, MembershipPurchaseRow } from "../membership.finalize";
import { finalizeMembershipPurchase } from "../membership.finalize";

type StoredMembership = {
  id: string;
  userId: string;
  membershipTypeId: string;
  paymentId: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentProvider: string;
  metadata: Record<string, unknown>;
};

/**
 * Integration tests for membership purchase finalization logic.
 * These tests verify membership creation, idempotency, and updates.
 */
describe("Membership Purchase Finalization Integration", () => {
  let mockTx: ReturnType<typeof createMockTransaction>;
  let mockDb: MembershipDbClient;
  let selectMembershipResult: StoredMembership[];

  function createMockTransaction() {
    const membershipsTable: StoredMembership[] = [];
    const purchaseUpdates: Array<Record<string, unknown>> = [];

    return {
      membershipsTable,
      purchaseUpdates,
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue(selectMembershipResult),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values) => {
          const newMembership = {
            id: `membership-${membershipsTable.length + 1}`,
            ...values,
          } as StoredMembership;
          membershipsTable.push(newMembership);
          return {
            returning: vi.fn().mockResolvedValue([newMembership]),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((values) => ({
          where: vi.fn().mockImplementation(() => {
            purchaseUpdates.push(values);
            return Promise.resolve();
          }),
        })),
      })),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    selectMembershipResult = [];
    mockTx = createMockTransaction();
    mockDb = {
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockTx);
      }),
    } as unknown as MembershipDbClient;
  });

  function createPurchase(overrides: Partial<MembershipPurchaseRow> = {}) {
    const basePurchase: MembershipPurchaseRow = {
      id: "purchase-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      membershipTypeId: "type-789",
      userId: "user-456",
      email: null,
      eventId: null,
      registrationGroupMemberId: null,
      startDate: "2025-01-15",
      endDate: "2026-01-15",
      status: "pending",
      paymentProvider: null,
      paymentId: null,
      membershipId: null,
      metadata: {},
    };

    return { ...basePurchase, ...overrides };
  }

  describe("New Membership Creation", () => {
    it("creates a new membership when none exists for payment", async () => {
      const purchase = createPurchase();

      const membershipType = {
        id: "type-789",
        name: "Annual Player Membership",
        description: null,
        priceCents: 4500,
        durationMonths: 12,
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipPurchase({
        db: mockDb,
        purchase,
        membershipType,
        paymentId: "pay-123",
        orderId: "order-1",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.wasCreated).toBe(true);
      expect(result.membership).toMatchObject({
        userId: "user-456",
        membershipTypeId: "type-789",
        paymentId: "pay-123",
        status: "active",
        paymentProvider: "square",
      });
    });

    it("calculates correct end date based on membership duration", async () => {
      const now = new Date("2025-01-15");
      const purchase = createPurchase({ startDate: "2025-01-15" });

      const membershipType = {
        id: "type-789",
        name: "Annual Player Membership",
        description: null,
        priceCents: 4500,
        durationMonths: 12,
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipPurchase({
        db: mockDb,
        purchase,
        membershipType,
        paymentId: "pay-123",
        sessionId: "session-123",
        now,
      });

      expect(result.membership?.startDate).toBe("2025-01-15");
      expect(result.membership?.endDate).toBe("2026-01-15");
    });
  });

  describe("Idempotency", () => {
    it("returns existing membership when payment already processed", async () => {
      const existingMembership: StoredMembership = {
        id: "existing-membership-1",
        userId: "user-456",
        membershipTypeId: "type-789",
        paymentId: "pay-123",
        startDate: "2025-01-01",
        endDate: "2026-01-01",
        status: "active",
        paymentProvider: "square",
        metadata: {},
      };

      selectMembershipResult = [existingMembership];

      const purchase = createPurchase();

      const membershipType = {
        id: "type-789",
        name: "Annual Player Membership",
        description: null,
        priceCents: 4500,
        durationMonths: 12,
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipPurchase({
        db: mockDb,
        purchase,
        membershipType,
        paymentId: "pay-123",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.wasCreated).toBe(false);
      expect(result.membership?.id).toBe("existing-membership-1");
      expect(mockTx.purchaseUpdates[0]?.["membershipId"]).toBe("existing-membership-1");
    });
  });

  describe("Metadata Handling", () => {
    it("preserves purchase metadata when creating membership", async () => {
      const purchase = createPurchase({
        metadata: {
          referralCode: "FRIEND2025",
          utmSource: "email",
        },
      });

      const membershipType = {
        id: "type-789",
        name: "Annual Player Membership",
        description: null,
        priceCents: 4500,
        durationMonths: 12,
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipPurchase({
        db: mockDb,
        purchase,
        membershipType,
        paymentId: "pay-123",
        orderId: "order-1",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.membership?.metadata).toMatchObject({
        referralCode: "FRIEND2025",
        utmSource: "email",
        sessionId: "session-123",
        squareTransactionId: "pay-123",
        squareOrderId: "order-1",
      });
    });
  });

  describe("Event-Scoped Purchases", () => {
    it("marks purchases active without creating memberships", async () => {
      const purchase = createPurchase({ eventId: "event-123" });

      const membershipType = {
        id: "type-789",
        name: "Event Day Pass",
        description: null,
        priceCents: 2500,
        durationMonths: 0,
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipPurchase({
        db: mockDb,
        purchase,
        membershipType,
        paymentId: "pay-123",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.wasCreated).toBe(false);
      expect(result.membership).toBeNull();
      expect(mockTx.purchaseUpdates[0]?.["status"]).toBe("active");
    });
  });
});
