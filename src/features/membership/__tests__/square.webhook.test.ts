import { beforeEach, describe, expect, it, vi } from "vitest";
import { __squareWebhookTestUtils } from "~/routes/api/webhooks/square";

const sendMembershipPurchaseReceiptMock = vi.fn();
const getEmailServiceMock = vi.fn();

const finalizeMembershipForSessionMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("~/db/server-helpers", () => ({
  getDb: getDbMock,
}));

vi.mock("~/features/membership/membership.finalize", () => ({
  finalizeMembershipForSession: finalizeMembershipForSessionMock,
}));

vi.mock("~/lib/email/sendgrid", () => ({
  sendMembershipPurchaseReceipt: sendMembershipPurchaseReceiptMock,
  getEmailService: getEmailServiceMock,
}));

describe("square webhook helpers", () => {
  let limit: ReturnType<typeof vi.fn>;
  let from: ReturnType<typeof vi.fn>;
  let where: ReturnType<typeof vi.fn>;
  let select: ReturnType<typeof vi.fn>;
  let updateRecords: Array<{ table: unknown; values: unknown }>;
  let update: ReturnType<typeof vi.fn>;

  const sessionBase = {
    id: "session-1",
    userId: "user-1",
    membershipTypeId: "type-1",
    squareCheckoutId: "checkout-1",
    squarePaymentId: "pay-1",
    squareOrderId: "order-1",
    amountCents: 4500,
    currency: "CAD",
    status: "pending" as const,
    metadata: {},
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  const membershipType = {
    id: "type-1",
    name: "Annual Player Membership",
    description: null,
    priceCents: 4500,
    durationMonths: 12,
    status: "active" as const,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const chainFactory = () => ({
    from,
    where,
    limit,
  });

  beforeEach(() => {
    limit = vi.fn();
    from = vi.fn(() => chainFactory());
    where = vi.fn(() => chainFactory());
    select = vi.fn(() => chainFactory());

    updateRecords = [];
    update = vi.fn((table: unknown) => ({
      set: (values: unknown) => {
        updateRecords.push({ table, values });
        return {
          where: vi.fn(async () => undefined),
        };
      },
    }));

    sendMembershipPurchaseReceiptMock.mockReset();
    getEmailServiceMock.mockReset();
    finalizeMembershipForSessionMock.mockReset();

    getDbMock.mockResolvedValue({
      select,
      update,
    });

    delete process.env["SUPPORT_EMAIL"];
  });

  it("finalizes membership and sends receipt on completed payment", async () => {
    const membershipSession = { ...sessionBase };

    limit
      .mockResolvedValueOnce([membershipSession]) // find session by payment id
      .mockResolvedValueOnce([membershipType]) // fetch membership type
      .mockResolvedValueOnce([{ email: "member@example.com", name: "Jess" }]); // fetch user

    finalizeMembershipForSessionMock.mockResolvedValue({
      membership: {
        id: "membership-1",
        userId: membershipSession.userId,
        membershipTypeId: membershipType.id,
        startDate: "2025-09-20",
        endDate: "2026-09-20",
        status: "active" as const,
        paymentProvider: "square",
        paymentId: "pay-1",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      wasCreated: true,
    });

    await __squareWebhookTestUtils.finalizeMembershipFromWebhook({
      paymentId: "pay-1",
      orderId: "order-1",
      eventType: "payment.updated",
    });

    expect(finalizeMembershipForSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pay-1",
        orderId: "order-1",
      }),
    );

    expect(sendMembershipPurchaseReceiptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.objectContaining({ email: "member@example.com" }),
        membershipType: membershipType.name,
      }),
    );

    expect(updateRecords.length).toBeGreaterThanOrEqual(1);
    // With atomic JSONB merge, metadata is a SQL expression, not a plain object
    // Verify the update was called with updatedAt set
    expect(updateRecords.at(-1)?.values).toMatchObject({
      updatedAt: expect.any(Date),
    });
    // Verify metadata field exists (will be SQL expression)
    expect(
      (updateRecords.at(-1)?.values as Record<string, unknown>)?.["metadata"],
    ).toBeDefined();
  });

  it("cancels membership and notifies support on refund", async () => {
    process.env["SUPPORT_EMAIL"] = "ops@example.com";

    const membership = {
      id: "membership-1",
      userId: sessionBase.userId,
      membershipTypeId: membershipType.id,
      startDate: "2025-09-20",
      endDate: "2026-09-20",
      status: "active" as const,
      paymentProvider: "square",
      paymentId: "pay-1",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    limit.mockResolvedValueOnce([membership]);

    const sendSpy = vi.fn();
    getEmailServiceMock.mockResolvedValue({ send: sendSpy });

    await __squareWebhookTestUtils.handleRefundEvent({
      paymentId: "pay-1",
      refundId: "refund-1",
      status: "COMPLETED",
      eventType: "refund.updated",
    });

    expect(updateRecords.length).toBe(1);
    // With atomic JSONB merge, metadata is a SQL expression, not a plain object
    expect(updateRecords[0].values).toMatchObject({
      status: "cancelled",
      updatedAt: expect.any(Date),
    });
    // Verify metadata field exists (will be SQL expression)
    expect(
      (updateRecords[0].values as Record<string, unknown>)?.["metadata"],
    ).toBeDefined();

    expect(getEmailServiceMock).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: "ops@example.com" },
        subject: expect.stringContaining("Membership refund"),
      }),
    );
  });
});
