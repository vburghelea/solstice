import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

export type NotificationDispatch = {
  // stable id for idempotency across retries
  notificationId?: string;

  userId: string;
  organizationId?: string | null;
  type: string;
  category: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: JsonRecord;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableSesError = (error: unknown) => {
  const err = error as Record<string, unknown>;
  const errName = err?.["name"];
  const errCode = err?.["Code"];
  const code = (errName ?? errCode ?? null) as string | null;
  const metadata = err?.["$metadata"] as { httpStatusCode?: number } | undefined;
  const status = metadata?.httpStatusCode ?? null;

  return (
    code === "ThrottlingException" ||
    code === "ServiceUnavailableException" ||
    code === "TooManyRequestsException" ||
    (typeof status === "number" && status >= 500)
  );
};

const buildEmailText = (payload: NotificationDispatch) => {
  const lines = [payload.body];
  if (payload.link) {
    lines.push("", `Open: ${payload.link}`);
  }
  return lines.join("\n");
};

const sendEmailWithRetry = async (params: {
  to: string;
  subject: string;
  bodyText: string;
}) => {
  const from = process.env["SIN_NOTIFICATIONS_FROM_EMAIL"];
  if (!from) {
    throw new Error("SIN_NOTIFICATIONS_FROM_EMAIL is not configured.");
  }

  const replyTo = process.env["SIN_NOTIFICATIONS_REPLY_TO_EMAIL"] ?? null;
  const region = process.env["AWS_REGION"] ?? "ca-central-1";
  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

  const client = new SESClient({ region });

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await client.send(
        new SendEmailCommand({
          Source: from,
          Destination: { ToAddresses: [params.to] },
          ReplyToAddresses: replyTo ? [replyTo] : undefined,
          Message: {
            Subject: { Data: params.subject },
            Body: { Text: { Data: params.bodyText } },
          },
        }),
      );
    } catch (error) {
      if (attempt === maxAttempts || !isRetryableSesError(error)) {
        throw error;
      }
      const backoffMs = Math.min(10_000, 250 * 2 ** (attempt - 1));
      await sleep(backoffMs);
    }
  }

  throw new Error("SES send failed after retries.");
};

export const sendDigestEmail = createServerOnlyFn(
  async (params: { userId: string; subject: string; bodyText: string }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { user } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();

    const [recipient] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, params.userId))
      .limit(1);

    const to = recipient?.email ?? null;
    const isAnonymized = !!to && to.toLowerCase().endsWith("@example.invalid");

    if (!to || isAnonymized) {
      return { sent: false, skipped: true };
    }

    const response = await sendEmailWithRetry({
      to,
      subject: params.subject,
      bodyText: params.bodyText,
    });

    return { sent: true, messageId: response?.MessageId ?? null };
  },
);

export const sendNotification = createServerOnlyFn(
  async (payload: NotificationDispatch) => {
    const { randomUUID } = await import("crypto");
    const notificationId = payload.notificationId ?? randomUUID();

    const { getDb } = await import("~/db/server-helpers");
    const { notificationPreferences, notifications, user } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();

    const [preference] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, payload.userId),
          eq(notificationPreferences.category, payload.category),
        ),
      )
      .limit(1);

    const allowInApp = preference?.channelInApp ?? true;
    const emailFrequency = preference?.emailFrequency ?? "immediate";
    const emailEnabled = (preference?.channelEmail ?? true) && emailFrequency !== "never";
    const sendImmediateEmail = emailEnabled && emailFrequency === "immediate";

    let existingMetadata: JsonRecord | null = null;

    // In-app insert is idempotent when notificationId is stable
    if (allowInApp) {
      await db
        .insert(notifications)
        .values({
          id: notificationId,
          userId: payload.userId,
          organizationId: payload.organizationId ?? null,
          type: payload.type,
          category: payload.category,
          title: payload.title,
          body: payload.body,
          link: payload.link ?? null,
          metadata: payload.metadata ?? {},
        })
        .onConflictDoNothing();

      const [existing] = await db
        .select({ metadata: notifications.metadata })
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      existingMetadata = (existing?.metadata as JsonRecord) ?? null;
    }

    // Email idempotency: if we recorded emailSentAt, do not re-send on retries
    const alreadyEmailSent =
      !!existingMetadata && typeof existingMetadata["emailSentAt"] === "string";

    let emailSent = false;
    let emailMessageId: string | null = null;

    if (sendImmediateEmail) {
      const [recipient] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, payload.userId))
        .limit(1);

      const to = recipient?.email ?? null;
      const isAnonymized = !!to && to.toLowerCase().endsWith("@example.invalid");

      if (to && !isAnonymized && !alreadyEmailSent) {
        try {
          const resp = await sendEmailWithRetry({
            to,
            subject: payload.title,
            bodyText: buildEmailText(payload),
          });

          emailSent = true;
          emailMessageId = resp?.MessageId ?? null;

          if (allowInApp) {
            const nextMetadata: JsonRecord = {
              ...(existingMetadata ?? {}),
              ...(payload.metadata ?? {}),
              emailSentAt: new Date().toISOString(),
              ...(emailMessageId ? { emailMessageId } : {}),
            };

            await db
              .update(notifications)
              .set({ metadata: nextMetadata })
              .where(eq(notifications.id, notificationId));
          }
        } catch (error) {
          console.error("[Notifications] Email send failed", {
            userId: payload.userId,
            notificationId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Don't rethrow - in-app notification was created, email failure is logged
        }
      } else if (alreadyEmailSent) {
        emailSent = true;
      }
    }

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "NOTIFICATION_DISPATCH",
      actorUserId: payload.userId,
      actorOrgId: payload.organizationId ?? null,
      targetType: "notification",
      targetId: allowInApp ? notificationId : null,
      targetOrgId: payload.organizationId ?? null,
      metadata: {
        notificationId,
        category: payload.category,
        type: payload.type,
        channels: { inApp: allowInApp, email: emailEnabled },
        delivered: { email: emailSent },
        emailFrequency,
      },
    });

    return { inApp: allowInApp, email: emailSent };
  },
);
