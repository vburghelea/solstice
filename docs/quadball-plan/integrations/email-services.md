# Email Services Integration Guide

## Overview

The platform uses SendGrid as the email service for all transactional and marketing emails.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Application   │────▶│  Email Service   │────▶│   SendGrid      │
│                 │     │                  │     │                 │
│ - User action   │     │ - Template mgmt  │     │ - Send email    │
│ - System event  │     │ - Rate limiting  │     │ - Track events  │
│ - Bulk send     │     │ - Logging        │     │ - Deliverability│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   Webhook       │
                                                 │   Handler       │
                                                 │                 │
                                                 │ - Track opens   │
                                                 │ - Track clicks  │
                                                 │ - Handle bounces│
                                                 └─────────────────┘
```

## SendGrid Integration

### 1. Configuration

```typescript
// src/lib/email/sendgrid.config.ts
export const sendgridConfig = {
  apiKey: process.env.SENDGRID_API_KEY,
  webhookKey: process.env.SENDGRID_WEBHOOK_KEY,
  fromEmail: "noreply@quadballcanada.ca",
  fromName: "Quadball Canada",
  replyTo: "support@quadballcanada.ca",
};

// Verify required env vars
if (!sendgridConfig.apiKey) {
  throw new Error("SENDGRID_API_KEY is required");
}
```

### 2. Client Setup

```typescript
// src/lib/email/sendgrid.client.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(sendgridConfig.apiKey);

export { sgMail };
```

### 3. Email Templates

```typescript
// src/lib/email/templates.ts
export const EMAIL_TEMPLATES = {
  // Transactional emails
  WELCOME: "d-welcome-123",
  EMAIL_VERIFICATION: "d-verify-456",
  PASSWORD_RESET: "d-reset-789",

  // Membership emails
  MEMBERSHIP_CONFIRMATION: "d-membership-confirmed-123",
  MEMBERSHIP_EXPIRING: "d-membership-expiring-456",
  MEMBERSHIP_EXPIRED: "d-membership-expired-789",

  // Event emails
  EVENT_REGISTRATION_CONFIRMED: "d-event-confirmed-123",
  EVENT_REMINDER: "d-event-reminder-456",
  EVENT_CANCELLED: "d-event-cancelled-789",

  // Team emails
  TEAM_INVITATION: "d-team-invite-123",
  ROSTER_UPDATE: "d-roster-update-456",

  // Payment emails
  PAYMENT_CONFIRMATION: "d-payment-confirmed-123",
  PAYMENT_FAILED: "d-payment-failed-456",
  REFUND_PROCESSED: "d-refund-processed-789",

  // Administrative
  BULK_ANNOUNCEMENT: "d-announcement-123",
  SURVEY_REQUEST: "d-survey-456",
} as const;
```

### 4. Email Service Implementation

```typescript
// src/lib/email/email.service.ts
interface EmailParams {
  to: string | string[];
  templateId: string;
  dynamicTemplateData?: Record<string, any>;
  subject?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export class EmailService {
  async sendEmail({
    to,
    templateId,
    dynamicTemplateData = {},
    subject,
    attachments = [],
  }: EmailParams) {
    try {
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: sendgridConfig.fromEmail,
          name: sendgridConfig.fromName,
        },
        replyTo: sendgridConfig.replyTo,
        templateId,
        dynamicTemplateData: {
          ...dynamicTemplateData,
          subject: subject || dynamicTemplateData.subject,
        },
        attachments,
      };

      const response = await sgMail.send(msg);

      // Log successful send
      await this.logEmailEvent({
        provider: "sendgrid",
        status: "sent",
        recipients: Array.isArray(to) ? to : [to],
        templateId,
        messageId: response[0].headers["x-message-id"],
      });

      return response;
    } catch (error) {
      console.error("SendGrid send error:", error);

      // Log failed send
      await this.logEmailEvent({
        provider: "sendgrid",
        status: "failed",
        recipients: Array.isArray(to) ? to : [to],
        templateId,
        error: error.message,
      });

      throw error;
    }
  }

  private async logEmailEvent(event: EmailEvent) {
    await db.insert(emailLogs).values({
      provider: event.provider,
      status: event.status,
      recipients: event.recipients,
      templateId: event.templateId,
      messageId: event.messageId,
      error: event.error,
    });
  }
}

export const emailService = new EmailService();
```

### 5. Common Email Functions

```typescript
// src/lib/email/common.ts
export async function sendWelcomeEmail(user: User) {
  return emailService.sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.WELCOME,
    dynamicTemplateData: {
      name: user.name,
      loginUrl: `${process.env.VITE_BASE_URL}/login`,
      profileUrl: `${process.env.VITE_BASE_URL}/profile`,
    },
  });
}

export async function sendMembershipConfirmation({
  user,
  membership,
}: {
  user: User;
  membership: Membership;
}) {
  return emailService.sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.MEMBERSHIP_CONFIRMATION,
    dynamicTemplateData: {
      name: user.name,
      membershipType: membership.membershipType.name,
      expiresAt: format(new Date(membership.expiresAt), "MMMM d, yyyy"),
      dashboardUrl: `${process.env.VITE_BASE_URL}/dashboard`,
    },
  });
}

export async function sendEventRegistrationConfirmation({
  user,
  event,
  registration,
}: {
  user: User;
  event: Event;
  registration: EventRegistration;
}) {
  const icalContent = generateICalEvent(event);

  return emailService.sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.EVENT_REGISTRATION_CONFIRMED,
    dynamicTemplateData: {
      name: user.name,
      eventName: event.name,
      eventDate: format(new Date(event.startDate), "EEEE, MMMM d, yyyy"),
      eventLocation: event.location,
      eventUrl: `${process.env.VITE_BASE_URL}/events/${event.slug}`,
    },
    attachments: [
      {
        content: Buffer.from(icalContent).toString("base64"),
        filename: `${event.slug}.ics`,
        type: "text/calendar",
      },
    ],
  });
}
```

### 6. Bulk Email System

```typescript
// src/lib/email/bulk.service.ts
interface BulkEmailParams {
  recipients: Array<{
    email: string;
    name: string;
    customData?: Record<string, any>;
  }>;
  templateId: string;
  globalData?: Record<string, any>;
  sendAt?: Date;
}

export async function sendBulkEmail({
  recipients,
  templateId,
  globalData = {},
  sendAt,
}: BulkEmailParams) {
  // Chunk recipients to avoid rate limits
  const chunks = chunk(recipients, 100);
  const results = [];

  for (const recipientChunk of chunks) {
    try {
      const personalizations = recipientChunk.map((recipient) => ({
        to: [{ email: recipient.email, name: recipient.name }],
        dynamicTemplateData: {
          ...globalData,
          ...recipient.customData,
          name: recipient.name,
        },
      }));

      const msg = {
        from: {
          email: sendgridConfig.fromEmail,
          name: sendgridConfig.fromName,
        },
        templateId,
        personalizations,
        sendAt: sendAt ? Math.floor(sendAt.getTime() / 1000) : undefined,
      };

      const response = await sgMail.send(msg);
      results.push(...response);

      // Rate limiting delay
      await sleep(1000);
    } catch (error) {
      console.error("Bulk email chunk failed:", error);
      // Continue with other chunks
    }
  }

  return results;
}

// Usage example
export async function sendMembershipExpiryReminders() {
  const expiringMembers = await db.query.memberships.findMany({
    where: and(
      eq(memberships.status, "active"),
      between(
        memberships.expiresAt,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ),
    ),
    with: {
      user: true,
      membershipType: true,
    },
  });

  const recipients = expiringMembers.map((membership) => ({
    email: membership.user.email,
    name: membership.user.name,
    customData: {
      membershipType: membership.membershipType.name,
      expiresAt: format(new Date(membership.expiresAt), "MMMM d, yyyy"),
      renewUrl: `${process.env.VITE_BASE_URL}/membership/renew`,
    },
  }));

  return sendBulkEmail({
    recipients,
    templateId: EMAIL_TEMPLATES.MEMBERSHIP_EXPIRING,
  });
}
```

## Webhook Handling

### 1. SendGrid Webhook Endpoint

```typescript
// src/routes/api/webhooks/sendgrid.ts
export const Route = createAPIFileRoute("/api/webhooks/sendgrid")({
  POST: async ({ request }) => {
    const events = await request.json();

    // Verify webhook signature
    const signature = request.headers.get("x-twilio-email-event-webhook-signature");
    const timestamp = request.headers.get("x-twilio-email-event-webhook-timestamp");

    if (!verifyWebhookSignature(signature, timestamp, JSON.stringify(events))) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Process events
    for (const event of events) {
      await processSendGridEvent(event);
    }

    return new Response("OK");
  },
});

async function processSendGridEvent(event: SendGridEvent) {
  const { email, event: eventType, timestamp, sg_message_id } = event;

  // Update email log
  await db
    .update(emailLogs)
    .set({
      status: eventType,
      deliveredAt: eventType === "delivered" ? new Date(timestamp * 1000) : undefined,
      openedAt: eventType === "open" ? new Date(timestamp * 1000) : undefined,
      clickedAt: eventType === "click" ? new Date(timestamp * 1000) : undefined,
      bouncedAt: ["bounce", "blocked"].includes(eventType)
        ? new Date(timestamp * 1000)
        : undefined,
    })
    .where(eq(emailLogs.messageId, sg_message_id));

  // Handle specific events
  switch (eventType) {
    case "bounce":
    case "blocked":
      await handleEmailBounce(email, event);
      break;

    case "unsubscribe":
      await handleUnsubscribe(email);
      break;

    case "spam_report":
      await handleSpamReport(email);
      break;
  }
}
```

### 2. Email Deliverability Management

```typescript
// src/lib/email/deliverability.ts
export async function handleEmailBounce(email: string, event: SendGridEvent) {
  // Check bounce type
  const bounceType = event.reason?.includes("Invalid") ? "hard" : "soft";

  if (bounceType === "hard") {
    // Mark email as invalid
    await db
      .update(users)
      .set({
        emailValid: false,
        emailBounced: true,
        emailBouncedAt: new Date(),
      })
      .where(eq(users.email, email));
  }

  // Log bounce for monitoring
  await db.insert(emailBounces).values({
    email,
    bounceType,
    reason: event.reason,
    timestamp: new Date(event.timestamp * 1000),
  });
}

export async function handleUnsubscribe(email: string) {
  await db
    .update(users)
    .set({
      emailOptOut: true,
      emailOptOutAt: new Date(),
    })
    .where(eq(users.email, email));
}
```

## Email Templates Management

### 1. Template Development

```typescript
// src/lib/email/template-builder.ts
export function buildMembershipConfirmationTemplate(data: {
  name: string;
  membershipType: string;
  expiresAt: string;
  dashboardUrl: string;
}) {
  return {
    subject: `Welcome to Quadball Canada - ${data.membershipType} Confirmed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Membership Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to Quadball Canada!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.name},</p>
            
            <p>Congratulations! Your <strong>${data.membershipType}</strong> membership has been confirmed.</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Membership Details</h3>
              <ul>
                <li><strong>Type:</strong> ${data.membershipType}</li>
                <li><strong>Valid Until:</strong> ${data.expiresAt}</li>
              </ul>
            </div>
            
            <p>You can now access your member dashboard to:</p>
            <ul>
              <li>Register for events and tournaments</li>
              <li>Join or create teams</li>
              <li>Connect with other players</li>
              <li>Access member-only resources</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" 
                 style="background: #1e40af; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <p>If you have any questions, feel free to contact us at support@quadballcanada.ca</p>
            
            <p>Welcome to the community!</p>
            <p>The Quadball Canada Team</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© 2025 Quadball Canada. All rights reserved.</p>
            <p>
              <a href="{{unsubscribe}}" style="color: #666;">Unsubscribe</a> | 
              <a href="https://quadballcanada.ca/privacy" style="color: #666;">Privacy Policy</a>
            </p>
          </div>
        </body>
      </html>
    `,
  };
}
```

### 2. Template Testing

```typescript
// src/tests/email/templates.test.ts
describe("Email Templates", () => {
  test("membership confirmation template", () => {
    const template = buildMembershipConfirmationTemplate({
      name: "John Doe",
      membershipType: "2025-2026 Player Membership",
      expiresAt: "December 31, 2026",
      dashboardUrl: "https://app.quadballcanada.ca/dashboard",
    });

    expect(template.subject).toContain("2025-2026 Player Membership");
    expect(template.html).toContain("John Doe");
    expect(template.html).toContain("December 31, 2026");
  });
});
```

## Monitoring & Analytics

```typescript
// src/lib/email/analytics.ts
export async function getEmailMetrics(period: string = '30d') {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const metrics = await db
    .select({
      sent: count(case(when(eq(emailLogs.status, 'sent'), 1))),
      delivered: count(case(when(eq(emailLogs.status, 'delivered'), 1))),
      opened: count(case(when(isNotNull(emailLogs.openedAt), 1))),
      clicked: count(case(when(isNotNull(emailLogs.clickedAt), 1))),
      bounced: count(case(when(isNotNull(emailLogs.bouncedAt), 1)))
    })
    .from(emailLogs)
    .where(gte(emailLogs.createdAt, startDate))

  const [result] = metrics

  return {
    sent: result.sent,
    delivered: result.delivered,
    opened: result.opened,
    clicked: result.clicked,
    bounced: result.bounced,
    deliveryRate: result.sent > 0 ? (result.delivered / result.sent * 100) : 0,
    openRate: result.delivered > 0 ? (result.opened / result.delivered * 100) : 0,
    clickRate: result.delivered > 0 ? (result.clicked / result.delivered * 100) : 0,
    bounceRate: result.sent > 0 ? (result.bounced / result.sent * 100) : 0
  }
}
```

## Best Practices

1. **Always use templates** for consistent branding
2. **Include unsubscribe links** in all marketing emails
3. **Monitor bounce rates** and clean invalid emails
4. **Test templates** across email clients
5. **Use proper SPF/DKIM** records for authentication
6. **Segment recipients** for targeted messaging
7. **Respect rate limits** when sending bulk emails
8. **Provide plain text versions** for accessibility
9. **Track engagement metrics** for optimization
10. **Handle failures gracefully** with fallback providers
