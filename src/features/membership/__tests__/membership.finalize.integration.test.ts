import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MembershipDbClient } from "../membership.finalize";
import { finalizeMembershipForSession } from "../membership.finalize";

/**
 * Integration tests for membership finalization logic.
 * These tests verify the business logic of membership creation
 * including idempotency and transaction handling.
 */
describe("Membership Finalization Integration", () => {
  // Mock database client that simulates real transaction behavior
  let mockTx: ReturnType<typeof createMockTransaction>;
  let mockDb: MembershipDbClient;

  function createMockTransaction() {
    const membershipsTable: Array<{
      id: string;
      userId: string;
      membershipTypeId: string;
      paymentId: string;
      startDate: string;
      endDate: string;
      status: string;
      paymentProvider: string;
      metadata: Record<string, unknown>;
    }> = [];

    const sessionsTable: Array<{
      id: string;
      status: string;
      squarePaymentId: string | null;
      squareOrderId: string | null;
      metadata: Record<string, unknown>;
      updatedAt: Date;
    }> = [];

    return {
      membershipsTable,
      sessionsTable,
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockImplementation(() => {
          // Return existing membership if payment ID matches
          const existingMembership = membershipsTable.find((m) => m.paymentId);
          return Promise.resolve(existingMembership ? [existingMembership] : []);
        }),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values) => {
          const newMembership = {
            id: `membership-${Date.now()}`,
            ...values,
          };
          membershipsTable.push(newMembership);
          return {
            returning: vi.fn().mockResolvedValue([newMembership]),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((values) => ({
          where: vi.fn().mockImplementation(() => {
            sessionsTable.push({
              id: "session-1",
              ...values,
            });
            return Promise.resolve();
          }),
        })),
      })),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTransaction();
    mockDb = {
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockTx);
      }),
    } as unknown as MembershipDbClient;
  });

  describe("New Membership Creation", () => {
    it("creates a new membership when none exists for payment", async () => {
      const paymentSession = {
        id: "session-123",
        userId: "user-456",
        membershipTypeId: "type-789",
        squareCheckoutId: "checkout-1",
        squarePaymentId: null,
        squareOrderId: "order-1",
        squarePaymentLinkUrl: "https://square.link/test-payment",
        amountCents: 4500,
        currency: "CAD",
        status: "pending" as const,
        metadata: {},
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

      const result = await finalizeMembershipForSession({
        db: mockDb,
        paymentSession,
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
      const paymentSession = {
        id: "session-123",
        userId: "user-456",
        membershipTypeId: "type-789",
        squareCheckoutId: "checkout-1",
        squarePaymentId: null,
        squareOrderId: null,
        squarePaymentLinkUrl: "https://square.link/test-payment",
        amountCents: 4500,
        currency: "CAD",
        status: "pending" as const,
        metadata: {},
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const membershipType = {
        id: "type-789",
        name: "Annual Player Membership",
        description: null,
        priceCents: 4500,
        durationMonths: 12, // 12 months
        status: "active" as const,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await finalizeMembershipForSession({
        db: mockDb,
        paymentSession,
        membershipType,
        paymentId: "pay-123",
        sessionId: "session-123",
        now,
      });

      // End date should be 12 months from start
      expect(result.membership.startDate).toBe("2025-01-15");
      expect(result.membership.endDate).toBe("2026-01-15");
    });
  });

  describe("Idempotency", () => {
    it("returns existing membership when payment already processed", async () => {
      // Pre-populate with existing membership
      const existingMembership = {
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

      // Override the mock to return existing membership
      const mockTxWithExisting = {
        ...mockTx,
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([existingMembership]),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      };

      const mockDbWithExisting = {
        transaction: vi.fn().mockImplementation(async (callback) => {
          return callback(mockTxWithExisting);
        }),
      } as unknown as MembershipDbClient;

      const paymentSession = {
        id: "session-123",
        userId: "user-456",
        membershipTypeId: "type-789",
        squareCheckoutId: "checkout-1",
        squarePaymentId: null,
        squareOrderId: null,
        squarePaymentLinkUrl: "https://square.link/test-payment",
        amountCents: 4500,
        currency: "CAD",
        status: "pending" as const,
        metadata: {},
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

      const result = await finalizeMembershipForSession({
        db: mockDbWithExisting,
        paymentSession,
        membershipType,
        paymentId: "pay-123",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.wasCreated).toBe(false);
      expect(result.membership.id).toBe("existing-membership-1");
    });
  });

  describe("Metadata Handling", () => {
    it("preserves existing session metadata when finalizing", async () => {
      const existingMetadata = {
        referralCode: "FRIEND2025",
        utmSource: "email",
      };

      const paymentSession = {
        id: "session-123",
        userId: "user-456",
        membershipTypeId: "type-789",
        squareCheckoutId: "checkout-1",
        squarePaymentId: null,
        squareOrderId: null,
        squarePaymentLinkUrl: "https://square.link/test-payment",
        amountCents: 4500,
        currency: "CAD",
        status: "pending" as const,
        metadata: existingMetadata,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

      const result = await finalizeMembershipForSession({
        db: mockDb,
        paymentSession,
        membershipType,
        paymentId: "pay-123",
        orderId: "order-1",
        sessionId: "session-123",
        now: new Date("2025-01-15"),
      });

      expect(result.membership.metadata).toMatchObject({
        referralCode: "FRIEND2025",
        utmSource: "email",
        sessionId: "session-123",
        squareTransactionId: "pay-123",
        squareOrderId: "order-1",
      });
    });
  });
});
