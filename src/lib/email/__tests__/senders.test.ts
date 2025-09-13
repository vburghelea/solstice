import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailRecipient } from "~/lib/email/resend";
import * as resend from "~/lib/email/resend";

// Stub database-related modules used in preference gating
vi.mock("~/db/server-helpers", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: async () => [],
      }),
    }),
  }),
}));

vi.mock("drizzle-orm", () => ({
  inArray: () => [],
}));

vi.mock("~/db/schema", () => ({
  user: { email: "email", notificationPreferences: "prefs" },
}));

describe("email senders", () => {
  const baseRecipient: EmailRecipient = { email: "user@example.com", name: "User" };
  const now = new Date("2025-01-01T00:00:00Z");
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs membership receipt send", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await resend.sendMembershipPurchaseReceipt({
      to: baseRecipient,
      membershipType: "Premium",
      amount: 1000,
      paymentId: "pay_1",
      expiresAt: now,
      membershipId: "m1",
    });
    expect(log).toHaveBeenCalledWith(
      "email.send.attempt",
      expect.objectContaining({
        entity: "membership_receipt",
        entityId: "m1",
        subject: "Membership Purchase Confirmation - Roundup Games",
      }),
    );
  });

  it("logs game invitation send", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await resend.sendGameInvitation({
      to: baseRecipient,
      inviterName: "Alice",
      gameName: "Epic Game",
      gameDescription: "Desc",
      gameSystem: "System",
      inviteUrl: "https://example.com/invite",
      expiresAt: now,
      invitationId: "gi1",
    });
    expect(log).toHaveBeenCalledWith(
      "email.send.attempt",
      expect.objectContaining({
        entity: "game_invitation",
        entityId: "gi1",
        subject: "Game Invitation: Epic Game - Roundup Games",
      }),
    );
  });

  it("logs campaign digest send", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await resend.sendCampaignDigest({
      to: baseRecipient,
      recipientName: "User",
      itemsHtml: "<li>Item</li>",
      manageUrl: "https://example.com/manage",
    });
    expect(log).toHaveBeenCalledWith(
      "email.send.attempt",
      expect.objectContaining({
        subject: "Your Campaign Digest",
      }),
    );
  });
});
