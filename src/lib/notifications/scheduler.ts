import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";
import { enqueueNotification } from "./queue";

const applyTemplate = (template: string, variables: JsonRecord) =>
  template.replace(/{{\s*([^}]+)\s*}}/g, (_match, key) => {
    const value = variables[key.trim()];
    return value === undefined || value === null ? "" : String(value);
  });

export const scheduleNotification = createServerOnlyFn(
  async (params: {
    templateKey: string;
    userId?: string | null;
    organizationId?: string | null;
    roleFilter?: string | null;
    scheduledFor: Date;
    variables?: JsonRecord;
  }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { scheduledNotifications } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(scheduledNotifications)
      .values({
        templateKey: params.templateKey,
        userId: params.userId ?? null,
        organizationId: params.organizationId ?? null,
        roleFilter: params.roleFilter ?? null,
        scheduledFor: params.scheduledFor,
        variables: params.variables ?? {},
      })
      .returning();

    return created ?? null;
  },
);

export const processScheduledNotifications = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { notificationTemplates, scheduledNotifications } = await import("~/db/schema");
  const { and, eq, isNull, lte } = await import("drizzle-orm");

  const db = await getDb();
  const now = new Date();

  const pending = await db
    .select()
    .from(scheduledNotifications)
    .where(
      and(
        isNull(scheduledNotifications.sentAt),
        isNull(scheduledNotifications.failedAt),
        lte(scheduledNotifications.scheduledFor, now),
      ),
    )
    .limit(100);

  for (const job of pending) {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.key, job.templateKey))
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      if (!job.userId) {
        throw new Error("Scheduled notifications without userId are not supported yet.");
      }

      const variables = job.variables ?? {};
      await enqueueNotification({
        // Use job.id as stable notificationId for idempotency across retries
        notificationId: job.id,
        userId: job.userId,
        organizationId: job.organizationId ?? null,
        type: job.templateKey,
        category: template.category,
        title: applyTemplate(template.subject, variables),
        body: applyTemplate(template.bodyTemplate, variables),
        metadata: {
          scheduledNotificationId: job.id,
          templateKey: job.templateKey,
        },
      });

      await db
        .update(scheduledNotifications)
        .set({ sentAt: new Date() })
        .where(eq(scheduledNotifications.id, job.id));
    } catch (error) {
      console.error("Failed to process scheduled notification", error);
      const nextRetry = job.retryCount + 1;
      const maxRetries = 3;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (nextRetry <= maxRetries) {
        const backoffMinutes = Math.min(60, 5 * 2 ** job.retryCount);
        await db
          .update(scheduledNotifications)
          .set({
            scheduledFor: new Date(Date.now() + backoffMinutes * 60 * 1000),
            errorMessage,
            retryCount: nextRetry,
          })
          .where(eq(scheduledNotifications.id, job.id));
      } else {
        await db
          .update(scheduledNotifications)
          .set({
            failedAt: new Date(),
            errorMessage,
            retryCount: nextRetry,
          })
          .where(eq(scheduledNotifications.id, job.id));
      }
    }
  }

  return { processed: pending.length };
});
