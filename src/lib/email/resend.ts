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
  renderEmailVerificationEmail,
  renderEmailVerificationOTP,
  renderGameInvitationEmail,
  renderMembershipReceiptEmail,
  renderPasswordResetEmail,
  renderPasswordResetOTP,
  renderSignInOTP,
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
      expiresAt: params.expiresAt.toLocaleDateString("en-CA", {
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
      expiresAt: params.expiresAt.toLocaleDateString("en-CA"),
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
    gameName: string;
    inviteUrl: string;
    inviterName: string;
  }) => {
    const service = await getEmailService();
    const htmlContent = await renderGameInvitationEmail({
      recipientName: params.to.name || "there",
      inviterName: params.inviterName,
      gameName: params.gameName,
      inviteUrl: params.inviteUrl,
      gameDescription: "", // Placeholder, as it's not provided in params
      gameSystem: "", // Placeholder, as it's not provided in params
      expiresAt: "", // Placeholder, as it's not provided in params
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
      expiresAt: params.expiresAt.toLocaleDateString("en-CA", {
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
