/**
 * Resend email service wrapper
 * Provides type-safe methods for sending transactional emails
 */

import { serverOnly } from "@tanstack/react-start";
import { Resend } from "resend";

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
  PASSWORD_RESET: "password_reset",
  WELCOME: "welcome",
  MEMBERSHIP_PURCHASE_RECEIPT: "membership_purchase_receipt",
  TEAM_INVITATION: "team_invitation",
  EVENT_REGISTRATION_CONFIRMATION: "event_registration_confirmation",
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

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Verify Your Email - Roundup Games",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0ea5e9; margin: 0;">Roundup Games</h1>
  </div>

  <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>

    <p>Hello ${params.to.name || "there"},</p>

    <p>Welcome to Roundup Games! Please verify your email address to complete your registration.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.verificationUrl}"
         style="background-color: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Verify Email Address
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This link will expire on ${params.expiresAt.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
      <span style="word-break: break-all;">${params.verificationUrl}</span>
    </p>

    <p>If you didn't create an account with Roundup Games, please ignore this email.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      Best regards,<br>
      The Roundup Games Team
    </p>
  </div>
</body>
</html>
      `,
      text: `Hello ${params.to.name || "there"},

Welcome to Roundup Games! Please verify your email address to complete your registration.

Click this link to verify your email: ${params.verificationUrl}

This link will expire on ${params.expiresAt.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.

If you didn't create an account with Roundup Games, please ignore this email.

Best regards,
The Roundup Games Team`,
    });
  },
);

// Convenience function for sending password reset emails
export const sendPasswordReset = serverOnly(
  async (params: {
    to: { email: string; name?: string };
    resetUrl: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Reset Your Password - Roundup Games",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0ea5e9; margin: 0;">Roundup Games</h1>
  </div>

  <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>

    <p>Hello ${params.to.name || "there"},</p>

    <p>We received a request to reset your password for your Roundup Games account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.resetUrl}"
         style="background-color: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This link will expire on ${params.expiresAt.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
      <span style="word-break: break-all;">${params.resetUrl}</span>
    </p>

    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      Best regards,<br>
      The Roundup Games Team
    </p>
  </div>
</body>
</html>
      `,
      text: `Hello ${params.to.name || "there"},

We received a request to reset your password for your Roundup Games account.

Click this link to reset your password: ${params.resetUrl}

This link will expire on ${params.expiresAt.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Roundup Games Team`,
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

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Membership Purchase Confirmation - Roundup Games",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Membership Purchase Confirmation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0ea5e9; margin: 0;">Roundup Games</h1>
  </div>

  <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin-top: 0;">Membership Purchase Confirmation</h2>

    <p>Hello ${params.to.name || "Member"},</p>

    <p>Thank you for purchasing a <strong>${params.membershipType}</strong> membership!</p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Purchase Details</h3>
      <p><strong>Amount paid:</strong> $${(params.amount / 100).toFixed(2)}</p>
      <p><strong>Payment ID:</strong> ${params.paymentId}</p>
      <p><strong>Expires:</strong> ${params.expiresAt.toLocaleDateString("en-CA")}</p>
    </div>

    <p>You can view your membership status at any time by logging into your dashboard.</p>

    <p>If you have any questions, please contact us at <a href="mailto:staff@roundup.games" style="color: #0ea5e9;">staff@roundup.games</a>.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      Best regards,<br>
      The Roundup Games Team
    </p>
  </div>
</body>
</html>
      `,
      text: `Hello ${params.to.name || "Member"},

Thank you for purchasing a ${params.membershipType} membership!

Amount paid: $${(params.amount / 100).toFixed(2)}
Payment ID: ${params.paymentId}
Expires: ${params.expiresAt.toLocaleDateString("en-CA")}

You can view your membership status at any time by logging into your dashboard.

If you have any questions, please contact us at staff@roundup.games.

Best regards,
The Roundup Games Team`,
    });
  },
);

// Convenience function for sending welcome emails (migrated from SendGrid)
export const sendWelcomeEmail = serverOnly(
  async (params: { to: EmailRecipient; profileUrl: string }) => {
    const service = await getEmailService();

    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Welcome to Roundup Games!",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Roundup Games</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0ea5e9; margin: 0;">Roundup Games</h1>
  </div>

  <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin-top: 0;">Welcome to Roundup Games!</h2>

    <p>Hello ${params.to.name || "New Member"},</p>

    <p>We're thrilled to have you join our community!</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.profileUrl}"
         style="background-color: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Complete Your Profile
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
      <span style="word-break: break-all;">${params.profileUrl}</span>
    </p>

    <p>If you have any questions, feel free to reach out to us at <a href="mailto:staff@roundup.games" style="color: #0ea5e9;">staff@roundup.games</a>.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      Best regards,<br>
      The Roundup Games Team
    </p>
  </div>
</body>
</html>
      `,
      text: `Hello ${params.to.name || "New Member"},

We're thrilled to have you join our community!

To get started, please complete your profile: ${params.profileUrl}

If you have any questions, feel free to reach out to us at staff@roundup.games.

Best regards,
The Roundup Games Team`,
    });
  },
);
