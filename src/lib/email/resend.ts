/**
 * Resend email service wrapper
 * Provides type-safe methods for sending transactional emails
 *
 * Note: Most email templates have been moved to external files in src/shared/email-templates/
 * for better maintainability and to reduce bundle size.
 */

import { serverOnly } from "@tanstack/react-start";
import { Resend } from "resend";
import {
  generateTextFromHtml,
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

// Define types for better type safety
interface EmailRecipient {
  email: string;
  name?: string | undefined;
}

interface EmailData {
  to: EmailRecipient | EmailRecipient[];
  from: EmailRecipient;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: EmailRecipient;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string;
}

// Export types for consistency
export type { EmailData, EmailRecipient, SendEmailResult };

// Email template IDs (using Resend's template system)
export const EMAIL_TEMPLATES = {
  EMAIL_VERIFICATION: "email_verification",
  MEMBERSHIP_PURCHASE_RECEIPT: "membership_purchase_receipt",
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

// Mock email service for development
class MockEmailService {
  async send(data: EmailData): Promise<SendEmailResult> {
    console.log("📧 Mock Email Service - Sending email:", {
      to: data.to,
      subject: data.subject,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate success
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  setApiKey(): void {
    console.log("📧 Mock Email Service - API key set");
  }
}

// Real Resend service
class ResendEmailService {
  private client: Resend | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const apiKey = process.env["RESEND_API_KEY"];
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }

      this.client = new Resend(apiKey);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Resend:", error);
      throw error;
    }
  }

  async send(data: EmailData): Promise<SendEmailResult> {
    try {
      await this.initialize();

      if (!this.client) {
        throw new Error("Resend client not initialized");
      }

      // Convert to Resend format
      const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
      const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

      // Build email data object
      const emailData: Record<string, unknown> = {
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to: Array.isArray(data.to)
          ? data.to.map((r: EmailRecipient) => r.email)
          : [data.to.email],
        subject: data.subject,
      };

      // Add content (Resend requires either html or text)
      if (data.html) {
        emailData["html"] = data.html;
      }
      if (data.text) {
        emailData["text"] = data.text;
      }
      if (data.replyTo?.email) {
        emailData["reply_to"] = data.replyTo.email;
      }

      // Send email using Resend
      const response = await this.client.emails.send(emailData as never);

      console.log("Resend API call successful:", response);

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }
}

// Factory function to get the appropriate email service
const getEmailServiceInternal = serverOnly(async () => {
  const useResend = process.env["RESEND_API_KEY"] && process.env["NODE_ENV"] !== "test";

  if (useResend) {
    return new ResendEmailService();
  }

  return new MockEmailService();
});

// Exported wrapper functions
export const getEmailService = serverOnly(async () => {
  return getEmailServiceInternal();
});

// Convenience function for sending email verification
export const sendEmailVerification = serverOnly(
  async (params: {
    to: { email: string; name?: string | undefined };
    verificationUrl: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderEmailVerificationEmail({
      recipientName: params.to.name || "there",
      verificationUrl: params.verificationUrl,
      expiresAt: params.expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Verify Your Email - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending membership purchase receipts (migrated from SendGrid)
export const sendMembershipPurchaseReceipt = serverOnly(
  async (params: {
    to: EmailRecipient;
    membershipType: string;
    amount: number;
    paymentId: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderMembershipReceiptEmail({
      recipientName: params.to.name || "Member",
      membershipType: params.membershipType,
      amount: `$${(params.amount / 100).toFixed(2)}`,
      paymentId: params.paymentId,
      expiresAt: params.expiresAt.toLocaleDateString("en-US"),
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Membership Purchase Confirmation - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending game invitations
export const sendGameInvitation = serverOnly(
  async (params: {
    to: EmailRecipient;
    inviterName: string;
    gameName: string;
    gameDescription: string;
    gameSystem: string;
    inviteUrl: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderGameInvitationEmail({
      recipientName: params.to.name || "there",
      inviterName: params.inviterName,
      gameName: params.gameName,
      inviteUrl: params.inviteUrl,
      gameDescription: params.gameDescription,
      gameSystem: params.gameSystem,
      expiresAt: params.expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: `Game Invitation: ${params.gameName} - Roundup Games`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Game: invitation response notification (to inviter)
export const sendGameInviteResponse = serverOnly(
  async (params: {
    to: EmailRecipient; // inviter
    inviterName: string;
    inviteeName: string;
    gameName: string;
    response: "accepted" | "declined";
    time: Date;
    rosterUrl: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderGameInviteResponseEmail({
      inviterName: params.inviterName,
      inviteeName: params.inviteeName,
      gameName: params.gameName,
      response: params.response,
      time: params.time.toLocaleString("en-US"),
      rosterUrl: params.rosterUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Invite ${params.response}: ${params.gameName}`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Game: status update to participants
export const sendGameStatusUpdate = serverOnly(
  async (params: {
    to: EmailRecipient | EmailRecipient[];
    recipientName?: string; // optional when sending to many
    gameName: string;
    dateTime: Date;
    location: string;
    changeSummary: string;
    detailsUrl: string;
  }) => {
    const service = await getEmailService();
    // Preference gate: filter recipients by user.notificationPreferences.gameUpdates
    let recipients: EmailRecipient[] = Array.isArray(params.to) ? params.to : [params.to];
    try {
      const emails = recipients.map((r) => r.email).filter(Boolean);
      if (emails.length > 0) {
        const [{ inArray }] = await Promise.all([import("drizzle-orm")]);
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
        const db = await getDb();
        const { user } = await import("~/db/schema");
        const rows = await db
          .select({ email: user.email, prefs: user.notificationPreferences })
          .from(user)
          .where(inArray(user.email, emails));
        const allowed = new Set(
          rows.filter((r) => r.prefs?.gameUpdates !== false).map((r) => r.email || ""),
        );
        recipients = recipients.filter((r) => !r.email || allowed.has(r.email));
      }
    } catch (e) {
      // On any failure, fall back to provided list (do not block)
      console.error("Preference gate (gameUpdates) failed:", e);
    }

    if (recipients.length === 0) {
      return { success: true } as SendEmailResult;
    }
    const htmlContent = await renderGameStatusUpdateEmail({
      recipientName: params.recipientName || "there",
      gameName: params.gameName,
      dateTime: params.dateTime.toLocaleString("en-US"),
      location: params.location,
      changeSummary: params.changeSummary,
      detailsUrl: params.detailsUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    if (recipients.length <= 1) {
      return service.send({
        to: recipients,
        from: { email: fromEmail, name: fromName },
        subject: `Game Update: ${params.gameName}`,
        html: htmlContent,
        text: generateTextFromHtml(htmlContent),
      });
    }

    const chunks: EmailRecipient[][] = [];
    for (let i = 0; i < recipients.length; i += 15) {
      chunks.push(recipients.slice(i, i + 15));
    }
    const { paceBatch } = await import("~/lib/pacer/server");
    let anySuccess = false;
    await paceBatch(chunks, { batchSize: 1, delayMs: 1000 }, async (chunk) => {
      const res = await service.send({
        to: chunk,
        from: { email: fromEmail, name: fromName },
        subject: `Game Update: ${params.gameName}`,
        html: htmlContent,
        text: generateTextFromHtml(htmlContent),
      });
      anySuccess ||= res.success;
    });
    return { success: anySuccess };
  },
);

// Game: reminder
export const sendGameReminder = serverOnly(
  async (params: {
    to: EmailRecipient | EmailRecipient[];
    recipientName?: string;
    gameName: string;
    dateTime: Date;
    location: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderGameReminderEmail({
      recipientName: params.recipientName || "there",
      gameName: params.gameName,
      dateTime: params.dateTime.toLocaleString("en-US"),
      location: params.location,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Reminder: ${params.gameName}`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Campaign: invitation (to invitee)
export const sendCampaignInvitation = serverOnly(
  async (params: {
    to: EmailRecipient;
    inviterName: string;
    campaignName: string;
    campaignDescription: string;
    gameSystem: string;
    inviteUrl: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderCampaignInvitationEmail({
      recipientName: params.to.name || "there",
      inviterName: params.inviterName,
      campaignName: params.campaignName,
      campaignDescription: params.campaignDescription,
      gameSystem: params.gameSystem,
      inviteUrl: params.inviteUrl,
      expiresAt: params.expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Campaign Invitation: ${params.campaignName}`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Campaign: invite response (to owner)
export const sendCampaignInviteResponse = serverOnly(
  async (params: {
    to: EmailRecipient; // owner
    ownerName: string;
    inviterName: string;
    inviteeName: string;
    campaignName: string;
    response: "accepted" | "declined";
    time: Date;
    detailsUrl: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderCampaignInviteResponseEmail({
      ownerName: params.ownerName,
      inviterName: params.inviterName,
      inviteeName: params.inviteeName,
      campaignName: params.campaignName,
      response: params.response,
      time: params.time.toLocaleString("en-US"),
      detailsUrl: params.detailsUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Campaign ${params.response}: ${params.campaignName}`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Campaign: session update
export const sendCampaignSessionUpdate = serverOnly(
  async (params: {
    to: EmailRecipient | EmailRecipient[];
    recipientName?: string;
    sessionTitle: string;
    dateTime: Date;
    location: string;
    changeSummary: string;
    detailsUrl: string;
  }) => {
    const service = await getEmailService();
    // Preference gate: filter recipients by user.notificationPreferences.campaignUpdates
    let recipients: EmailRecipient[] = Array.isArray(params.to) ? params.to : [params.to];
    try {
      const emails = recipients.map((r) => r.email).filter(Boolean);
      if (emails.length > 0) {
        const [{ inArray }] = await Promise.all([import("drizzle-orm")]);
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
        const db = await getDb();
        const { user } = await import("~/db/schema");
        const rows = await db
          .select({ email: user.email, prefs: user.notificationPreferences })
          .from(user)
          .where(inArray(user.email, emails));
        const allowed = new Set(
          rows
            .filter((r) => r.prefs?.campaignUpdates !== false)
            .map((r) => r.email || ""),
        );
        recipients = recipients.filter((r) => !r.email || allowed.has(r.email));
      }
    } catch (e) {
      console.error("Preference gate (campaignUpdates) failed:", e);
    }

    if (recipients.length === 0) {
      return { success: true } as SendEmailResult;
    }
    const htmlContent = await renderCampaignSessionUpdateEmail({
      recipientName: params.recipientName || "there",
      sessionTitle: params.sessionTitle,
      dateTime: params.dateTime.toLocaleString("en-US"),
      location: params.location,
      changeSummary: params.changeSummary,
      detailsUrl: params.detailsUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    if (recipients.length <= 1) {
      return service.send({
        to: recipients,
        from: { email: fromEmail, name: fromName },
        subject: `Session Update: ${params.sessionTitle}`,
        html: htmlContent,
        text: generateTextFromHtml(htmlContent),
      });
    }

    const chunks: EmailRecipient[][] = [];
    for (let i = 0; i < recipients.length; i += 15) {
      chunks.push(recipients.slice(i, i + 15));
    }
    const { paceBatch } = await import("~/lib/pacer/server");
    let anySuccess = false;
    await paceBatch(chunks, { batchSize: 1, delayMs: 1000 }, async (chunk) => {
      const res = await service.send({
        to: chunk,
        from: { email: fromEmail, name: fromName },
        subject: `Session Update: ${params.sessionTitle}`,
        html: htmlContent,
        text: generateTextFromHtml(htmlContent),
      });
      anySuccess ||= res.success;
    });
    return { success: anySuccess };
  },
);

// Campaign: weekly digest
export const sendCampaignDigest = serverOnly(
  async (params: {
    to: EmailRecipient;
    recipientName?: string;
    itemsHtml: string;
    manageUrl: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderCampaignDigestEmail({
      recipientName: params.recipientName || params.to.name || "there",
      itemsHtml: params.itemsHtml,
      manageUrl: params.manageUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Your Campaign Digest`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Reviews: review reminder
export const sendReviewReminder = serverOnly(
  async (params: {
    to: EmailRecipient;
    recipientName?: string;
    gmName: string;
    gameName: string;
    dateTime: Date;
    reviewUrl: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderReviewReminderEmail({
      recipientName: params.recipientName || params.to.name || "there",
      gmName: params.gmName,
      gameName: params.gameName,
      dateTime: params.dateTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      reviewUrl: params.reviewUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Review Your GM: ${params.gmName}`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Auth: welcome email
export const sendWelcomeEmail = serverOnly(
  async (params: { to: EmailRecipient; profileUrl: string }) => {
    const service = await getEmailService();
    const htmlContent = await renderWelcomeEmail({
      recipientName: params.to.name || "there",
      profileUrl: params.profileUrl,
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: { email: fromEmail, name: fromName },
      subject: `Welcome to Roundup Games`,
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending email verification OTP
export const sendEmailVerificationOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderEmailVerificationOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Verify Your Email - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending password reset OTP
export const sendPasswordResetOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderPasswordResetOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Password Reset - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending password reset email
export const sendPasswordResetEmail = serverOnly(
  async (params: {
    to: { email: string; name?: string | undefined };
    resetUrl: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderPasswordResetEmail({
      recipientName: params.to.name || "there",
      resetUrl: params.resetUrl,
      expiresAt: params.expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Reset Your Password - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending sign-in OTP
export const sendSignInOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderSignInOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Sign-in OTP - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);
