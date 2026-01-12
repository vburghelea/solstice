/**
 * Transactional email service wrapper (SES-backed).
 */

import { z } from "zod";
import { getBrand } from "~/tenant";

// Email configuration schemas
export const EmailRecipientSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export const EmailDataSchema = z.object({
  to: z.union([EmailRecipientSchema, z.array(EmailRecipientSchema)]),
  from: EmailRecipientSchema,
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  templateId: z.string().optional(),
  dynamicTemplateData: z.record(z.string(), z.unknown()).optional(),
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
  REGISTRATION_GROUP_INVITATION: "registration_group_invitation",
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
    console.log("📧 Mock Email Service - API key set");
  }
}

// SES email service (default)
class SesEmailService {
  async send(data: EmailData): Promise<SendEmailResult> {
    try {
      const validatedData = EmailDataSchema.parse(data);

      if (validatedData.attachments?.length) {
        return {
          success: false,
          error: "SES email service does not support attachments",
        };
      }

      const recipients = Array.isArray(validatedData.to)
        ? validatedData.to
        : [validatedData.to];

      const body: { Text?: { Data: string }; Html?: { Data: string } } = {};
      if (validatedData.text) {
        body.Text = { Data: validatedData.text };
      }
      if (validatedData.html) {
        body.Html = { Data: validatedData.html };
      }

      if (!body.Text && !body.Html) {
        return { success: false, error: "Email body is required" };
      }

      const region = process.env["AWS_REGION"] ?? "ca-central-1";
      const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
      const client = new SESClient({ region });

      const response = await client.send(
        new SendEmailCommand({
          Source: validatedData.from.name
            ? `${validatedData.from.name} <${validatedData.from.email}>`
            : validatedData.from.email,
          Destination: {
            ToAddresses: recipients.map((recipient) => recipient.email),
          },
          ReplyToAddresses: validatedData.replyTo
            ? [validatedData.replyTo.email]
            : undefined,
          Message: {
            Subject: { Data: validatedData.subject },
            Body: body,
          },
        }),
      );

      const messageId = response?.MessageId;
      return messageId ? { success: true, messageId } : { success: true };
    } catch (error) {
      console.error("SES email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }
}

// Factory function to get the appropriate email service
type EmailService = MockEmailService | SesEmailService;

let cachedEmailService: EmailService | null = null;

const resolveEmailService = async (): Promise<EmailService> => {
  if (cachedEmailService) {
    return cachedEmailService;
  }

  const useMock = process.env["NODE_ENV"] === "test";
  cachedEmailService = useMock ? new MockEmailService() : new SesEmailService();
  return cachedEmailService;
};

export const getEmailService = async (): Promise<EmailService> => resolveEmailService();

const getBrandEmailConfig = () => {
  const brand = getBrand();
  const fromEmail =
    process.env["EMAIL_FROM_ADDRESS"] || brand.supportEmail || "info@solsticeapp.ca";
  const fromName = process.env["EMAIL_FROM_NAME"] || brand.name;
  const supportEmail = brand.supportEmail || fromEmail;
  const supportName = brand.supportName || brand.name;

  return { brand, fromEmail, fromName, supportEmail, supportName };
};

// Convenience function for sending membership purchase receipts
export const sendMembershipPurchaseReceipt = async (params: {
  to: EmailRecipient;
  membershipType: string;
  amount: number;
  paymentId: string;
  expiresAt: Date;
}) => {
  const service = await getEmailService();
  const { brand, fromEmail, fromName, supportEmail, supportName } = getBrandEmailConfig();

  return service.send({
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: `Membership Purchase Confirmation - ${brand.name}`,
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

If you have any questions, please contact us at ${supportEmail}.

Best regards,
${supportName}`,
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
    <h1 style="color: ${brand.themeColor ?? "#0ea5e9"};">Membership Purchase Confirmation</h1>
    
    <p>Hello ${params.to.name || "Member"},</p>
    
    <p>Thank you for purchasing a <strong>${params.membershipType}</strong> membership!</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0;">Purchase Details</h2>
      <p><strong>Amount paid:</strong> $${(params.amount / 100).toFixed(2)}</p>
      <p><strong>Payment ID:</strong> ${params.paymentId}</p>
      <p><strong>Expires:</strong> ${params.expiresAt.toLocaleDateString("en-CA")}</p>
    </div>
    
    <p>You can view your membership status at any time by logging into your dashboard.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      ${supportName}
    </p>
  </div>
</body>
</html>
    `,
  });
};

export const sendTeamInvitationEmail = async (params: {
  to: EmailRecipient;
  teamName: string;
  teamSlug: string;
  role: string;
  invitedByName?: string;
  invitedByEmail?: string;
}) => {
  const service = await getEmailService();
  const { brand, fromEmail, fromName } = getBrandEmailConfig();

  const siteUrl =
    process.env["SITE_URL"] ||
    process.env["URL"] ||
    process.env["VITE_BASE_URL"] ||
    "http://localhost:5173";
  const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  const dashboardUrl = `${normalizedSiteUrl}/dashboard/teams`;
  const invitationUrl = `${dashboardUrl}/${params.teamSlug}`;

  const inviterDisplay =
    params.invitedByName ||
    params.invitedByEmail ||
    `a ${brand.name} team representative`;

  const textBody = `You've been invited to join ${params.teamName} as a ${params.role}.

Accept or decline your invitation here: ${dashboardUrl}

If the link above doesn't work, copy and paste this URL into your browser: ${invitationUrl}

Invitation sent by ${inviterDisplay}.`;

  return service.send({
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: `${params.teamName} team invitation`,
    templateId: EMAIL_TEMPLATES.TEAM_INVITATION,
    dynamicTemplateData: {
      teamName: params.teamName,
      role: params.role,
      inviterName: inviterDisplay,
      dashboardUrl,
      invitationUrl,
    },
    text: textBody,
  });
};

export const sendRegistrationGroupInviteEmail = async (params: {
  to: EmailRecipient;
  eventName?: string;
  eventId: string;
  groupType: string;
  inviteToken: string;
  invitedByName?: string;
  invitedByEmail?: string;
}) => {
  const service = await getEmailService();
  const { brand, fromEmail, fromName, supportEmail, supportName } = getBrandEmailConfig();

  const siteUrl =
    process.env["SITE_URL"] ||
    process.env["URL"] ||
    process.env["VITE_BASE_URL"] ||
    "http://localhost:5173";
  const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  const inviteUrl = `${normalizedSiteUrl}/join/registration/${params.inviteToken}`;

  const inviterDisplay =
    params.invitedByName || params.invitedByEmail || `a ${brand.name} event organizer`;

  const groupLabel = params.groupType.replaceAll("_", " ");
  const eventLabel = params.eventName ?? "an upcoming event";

  const textBody = `You've been invited to join ${eventLabel} as part of a ${groupLabel} registration.

Accept your invitation here: ${inviteUrl}

If the link above doesn't work, copy and paste this URL into your browser: ${inviteUrl}

Invitation sent by ${inviterDisplay}.

If you have any questions, please contact ${supportEmail}.`;

  return service.send({
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: `You're invited to join ${eventLabel}`,
    templateId: EMAIL_TEMPLATES.REGISTRATION_GROUP_INVITATION,
    dynamicTemplateData: {
      eventName: eventLabel,
      groupType: groupLabel,
      inviterName: inviterDisplay,
      inviteUrl,
      supportEmail,
      supportName,
      brandName: brand.name,
    },
    text: textBody,
  });
};

// Convenience function for sending welcome emails
export const sendWelcomeEmail = async (params: {
  to: EmailRecipient;
  profileUrl: string;
}) => {
  const service = await getEmailService();
  const { brand, fromEmail, fromName, supportEmail, supportName } = getBrandEmailConfig();

  return service.send({
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: `Welcome to ${brand.name}!`,
    templateId: EMAIL_TEMPLATES.WELCOME,
    dynamicTemplateData: {
      memberName: params.to.name || "New Member",
      profileUrl: params.profileUrl,
      year: new Date().getFullYear(),
    },
    text: `Welcome to ${brand.name}!

We're thrilled to have you join our community.

To get started, please complete your profile: ${params.profileUrl}

If you have any questions, feel free to reach out to us at ${supportEmail}.

Best regards,
${supportName}`,
  });
};
