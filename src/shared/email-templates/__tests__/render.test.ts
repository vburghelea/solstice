import { describe, expect, it } from "vitest";
import type {
  CampaignDigestData,
  CampaignInvitationData,
  CampaignInviteResponseData,
  CampaignSessionUpdateData,
  EmailVerificationData,
  EmailVerificationOTPData,
  GameInvitationData,
  GameInviteResponseData,
  GameReminderData,
  GameStatusUpdateData,
  MembershipReceiptData,
  PasswordResetData,
  PasswordResetOTPData,
  ReviewReminderData,
  SignInOTPData,
  WelcomeEmailData,
} from "~/shared/email-templates";
import {
  renderCampaignDigestEmail,
  renderCampaignInvitationEmail,
  renderCampaignInviteResponseEmail,
  renderCampaignSessionUpdateEmail,
  renderEmailVerificationEmail,
  renderEmailVerificationOTP,
  renderGameInvitationEmail,
  renderGameInviteResponseEmail,
  renderGameReminderEmail,
  renderGameStatusUpdateEmail,
  renderMembershipReceiptEmail,
  renderPasswordResetEmail,
  renderPasswordResetOTP,
  renderReviewReminderEmail,
  renderSignInOTP,
  renderWelcomeEmail,
} from "~/shared/email-templates";

interface TemplateCase {
  name: string;
  render: (data: Record<string, string>) => Promise<string>;
  data: Record<string, string>;
}

const cases: TemplateCase[] = [
  {
    name: "campaign invitation",
    render: (data) =>
      renderCampaignInvitationEmail(data as unknown as CampaignInvitationData),
    data: {
      inviterName: "Alice",
      campaignName: "Epic Campaign",
      campaignDescription: "Desc",
      gameSystem: "System",
      inviteUrl: "https://example.com/invite",
      expiresAt: "Jan 1",
      recipientName: "Bob",
    },
  },
  {
    name: "game invitation",
    render: (data) => renderGameInvitationEmail(data as unknown as GameInvitationData),
    data: {
      inviterName: "Alice",
      gameName: "Epic Game",
      gameDescription: "Desc",
      gameSystem: "System",
      inviteUrl: "https://example.com/invite",
      expiresAt: "Jan 1",
      recipientName: "Bob",
    },
  },
  {
    name: "email verification",
    render: (data) =>
      renderEmailVerificationEmail(data as unknown as EmailVerificationData),
    data: {
      recipientName: "Bob",
      verificationUrl: "https://example.com/verify",
      expiresAt: "Jan 1",
    },
  },
  {
    name: "password reset",
    render: (data) => renderPasswordResetEmail(data as unknown as PasswordResetData),
    data: {
      recipientName: "Bob",
      resetUrl: "https://example.com/reset",
      expiresAt: "Jan 1",
    },
  },
  {
    name: "membership receipt",
    render: (data) =>
      renderMembershipReceiptEmail(data as unknown as MembershipReceiptData),
    data: {
      recipientName: "Bob",
      membershipType: "Premium",
      amount: "$10",
      paymentId: "pay_123",
      expiresAt: "Jan 1",
    },
  },
  {
    name: "welcome email",
    render: (data) => renderWelcomeEmail(data as unknown as WelcomeEmailData),
    data: {
      recipientName: "Bob",
      profileUrl: "https://example.com/profile",
    },
  },
  {
    name: "email verification otp",
    render: (data) =>
      renderEmailVerificationOTP(data as unknown as EmailVerificationOTPData),
    data: {
      recipientName: "Bob",
      otp: "123456",
    },
  },
  {
    name: "password reset otp",
    render: (data) => renderPasswordResetOTP(data as unknown as PasswordResetOTPData),
    data: {
      recipientName: "Bob",
      otp: "123456",
    },
  },
  {
    name: "sign in otp",
    render: (data) => renderSignInOTP(data as unknown as SignInOTPData),
    data: {
      recipientName: "Bob",
      otp: "123456",
    },
  },
  {
    name: "game invite response",
    render: (data) =>
      renderGameInviteResponseEmail(data as unknown as GameInviteResponseData),
    data: {
      inviterName: "Alice",
      inviteeName: "Bob",
      gameName: "Epic Game",
      response: "accepted",
      time: "Jan 1",
      rosterUrl: "https://example.com/roster",
    },
  },
  {
    name: "game status update",
    render: (data) =>
      renderGameStatusUpdateEmail(data as unknown as GameStatusUpdateData),
    data: {
      recipientName: "Bob",
      gameName: "Epic Game",
      dateTime: "Jan 1",
      location: "Arena",
      changeSummary: "Changed",
      detailsUrl: "https://example.com/details",
    },
  },
  {
    name: "game reminder",
    render: (data) => renderGameReminderEmail(data as unknown as GameReminderData),
    data: {
      recipientName: "Bob",
      gameName: "Epic Game",
      dateTime: "Jan 1",
      location: "Arena",
    },
  },
  {
    name: "campaign invite response",
    render: (data) =>
      renderCampaignInviteResponseEmail(data as unknown as CampaignInviteResponseData),
    data: {
      ownerName: "Olivia",
      inviterName: "Alice",
      inviteeName: "Bob",
      campaignName: "Epic Campaign",
      response: "accepted",
      time: "Jan 1",
      detailsUrl: "https://example.com/details",
    },
  },
  {
    name: "campaign session update",
    render: (data) =>
      renderCampaignSessionUpdateEmail(data as unknown as CampaignSessionUpdateData),
    data: {
      recipientName: "Bob",
      sessionTitle: "Session 1",
      dateTime: "Jan 1",
      location: "Arena",
      changeSummary: "Changed",
      detailsUrl: "https://example.com/details",
    },
  },
  {
    name: "campaign digest",
    render: (data) => renderCampaignDigestEmail(data as unknown as CampaignDigestData),
    data: {
      recipientName: "Bob",
      itemsHtml: "<li>Item</li>",
      manageUrl: "https://example.com/manage",
    },
  },
  {
    name: "review reminder",
    render: (data) => renderReviewReminderEmail(data as unknown as ReviewReminderData),
    data: {
      recipientName: "Bob",
      gmName: "GM",
      gameName: "Epic Game",
      dateTime: "Jan 1",
      reviewUrl: "https://example.com/review",
    },
  },
];

describe("email template rendering", () => {
  it.each(cases)("%s renders without placeholders", async ({ render, data }) => {
    const html = await render(data);
    expect(html).not.toContain("{{");
  });
});
