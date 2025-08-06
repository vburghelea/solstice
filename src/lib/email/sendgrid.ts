/**
 * SendGrid email service wrapper
 * Provides type-safe methods for sending transactional emails
 */

import { serverOnly } from "@tanstack/react-start";
import { z } from "zod";

// Email configuration schemas
export const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const EmailDataSchema = z.object({
  to: z.union([EmailRecipientSchema, z.array(EmailRecipientSchema)]),
  from: EmailRecipientSchema,
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  templateId: z.string().optional(),
  dynamicTemplateData: z.record(z.unknown()).optional(),
  replyTo: EmailRecipientSchema.optional(),
  attachments: z
    .array(
      z.object({
        content: z.string(),
        filename: z.string(),
        type: z.string().optional(),
        disposition: z.string().optional(),
      }),
    )
    .optional(),
});

export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
export type EmailData = z.infer<typeof EmailDataSchema>;

// Response types
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email template IDs (to be populated with actual SendGrid template IDs)
export const EMAIL_TEMPLATES = {
  MEMBERSHIP_PURCHASE_RECEIPT: "membership_purchase_receipt",
  WELCOME: "welcome",
  PASSWORD_RESET: "password_reset",
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
      templateId: data.templateId,
      dynamicTemplateData: data.dynamicTemplateData,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate success
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  setApiKey(_key: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const key = _key;
    console.log("📧 Mock Email Service - API key set");
  }
}

// Real SendGrid service
class SendGridEmailService {
  private client: unknown;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const sgMail = await import("@sendgrid/mail");
      this.client = sgMail.default;

      const apiKey = process.env["SENDGRID_API_KEY"];
      if (!apiKey) {
        throw new Error("SENDGRID_API_KEY environment variable is not set");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client as any).setApiKey(apiKey);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize SendGrid:", error);
      throw error;
    }
  }

  async send(data: EmailData): Promise<SendEmailResult> {
    try {
      await this.initialize();

      // Validate email data
      const validatedData = EmailDataSchema.parse(data);

      // Convert to SendGrid format
      const msg = {
        to: validatedData.to,
        from: validatedData.from,
        subject: validatedData.subject,
        text: validatedData.text,
        html: validatedData.html,
        templateId: validatedData.templateId,
        dynamicTemplateData: validatedData.dynamicTemplateData,
        replyTo: validatedData.replyTo,
        attachments: validatedData.attachments,
      };

      // Send email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [response] = await (this.client as any).send(msg);

      return {
        success: true,
        messageId: response.headers["x-message-id"],
      };
    } catch (error) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }
}

// Factory function to get the appropriate email service
const getEmailServiceInternal = serverOnly(async () => {
  const useSendGrid =
    process.env["SENDGRID_API_KEY"] && process.env["NODE_ENV"] !== "test";

  if (useSendGrid) {
    return new SendGridEmailService();
  }

  return new MockEmailService();
});

// Exported wrapper functions
export const getEmailService = serverOnly(async () => {
  return getEmailServiceInternal();
});

// Convenience function for sending membership purchase receipts
export const sendMembershipPurchaseReceipt = serverOnly(
  async (params: {
    to: EmailRecipient;
    membershipType: string;
    amount: number;
    paymentId: string;
    expiresAt: Date;
  }) => {
    const service = await getEmailService();

    const fromEmail = process.env["SENDGRID_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["SENDGRID_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Membership Purchase Confirmation - Roundup Games",
      templateId: EMAIL_TEMPLATES.MEMBERSHIP_PURCHASE_RECEIPT,
      dynamicTemplateData: {
        memberName: params.to.name || "Member",
        membershipType: params.membershipType,
        amount: `$${(params.amount / 100).toFixed(2)}`,
        paymentId: params.paymentId,
        expiresAt: params.expiresAt.toLocaleDateString("en-CA"),
        year: new Date().getFullYear(),
      },
      // Fallback plain text version
      text: `Thank you for purchasing a ${params.membershipType} membership!

Amount paid: $${(params.amount / 100).toFixed(2)}
Payment ID: ${params.paymentId}
Expires: ${params.expiresAt.toLocaleDateString("en-CA")}

You can view your membership status at any time by logging into your dashboard.

If you have any questions, please contact us at staff@roundup.games.

Best regards,
Roundup Games Team`,
      // HTML version (used if no template ID is configured)
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Membership Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #0ea5e9;">Membership Purchase Confirmation</h1>
    
    <p>Hello ${params.to.name || "Member"},</p>
    
    <p>Thank you for purchasing a <strong>${params.membershipType}</strong> membership!</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0;">Purchase Details</h2>
      <p><strong>Amount paid:</strong> $${(params.amount / 100).toFixed(2)}</p>
      <p><strong>Payment ID:</strong> ${params.paymentId}</p>
      <p><strong>Expires:</strong> ${params.expiresAt.toLocaleDateString("en-CA")}</p>
    </div>
    
    <p>You can view your membership status at any time by logging into your dashboard.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:staff@roundup.games">staff@roundup.games</a>.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      Roundup Games Team
    </p>
  </div>
</body>
</html>
      `,
    });
  },
);

// Convenience function for sending welcome emails
export const sendWelcomeEmail = serverOnly(
  async (params: { to: EmailRecipient; profileUrl: string }) => {
    const service = await getEmailService();

    const fromEmail = process.env["SENDGRID_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["SENDGRID_FROM_NAME"] || "Roundup Games";

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Welcome to Roundup Games!",
      templateId: EMAIL_TEMPLATES.WELCOME,
      dynamicTemplateData: {
        memberName: params.to.name || "New Member",
        profileUrl: params.profileUrl,
        year: new Date().getFullYear(),
      },
      text: `Welcome to Roundup Games!

We're thrilled to have you join our community.

To get started, please complete your profile: ${params.profileUrl}

If you have any questions, feel free to reach out to us at staff@roundup.games.

Best regards,
Roundup Games Team`,
    });
  },
);
