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
  renderMembershipReceiptEmail,
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
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Invitation - Roundup Games</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Roundup Games</h1>
    <p style="color: #6b7280; margin: 10px 0 0 0;">Game Invitation</p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="margin-top: 0; color: #1f2937;">You've been invited to join a game!</h2>

    <p>Hi ${params.to.name || "there"},</p>

    <p><strong>${params.inviterName}</strong> has invited you to join their game <strong>"${params.gameName}"</strong> on Roundup Games.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
    </div>

    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${params.inviteUrl}</p>

    <p>We hope to see you in the game soon!</p>

    <p>Best regards,<br>The Roundup Games Team</p>
  </div>

  <div style="text-align: center; color: #9ca3af; font-size: 14px;">
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    <p>© 2024 Roundup Games. All rights reserved.</p>
  </div>
</body>
</html>`;

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
      text: `
You've been invited to join a game!

Hi ${params.to.name || "there"},

${params.inviterName} has invited you to join their game "${params.gameName}" on Roundup Games.

Accept the invitation here: ${params.inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The Roundup Games Team

© 2024 Roundup Games. All rights reserved.
      `.trim(),
    });
  },
);
