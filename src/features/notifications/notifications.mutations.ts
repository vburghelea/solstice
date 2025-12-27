import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createNotificationSchema,
  createNotificationTemplateSchema,
  deleteNotificationTemplateSchema,
  dismissNotificationSchema,
  markNotificationReadSchema,
  scheduleNotificationSchema,
  updateNotificationPreferencesSchema,
  updateNotificationTemplateSchema,
} from "./notifications.schemas";
import type { NotificationPreferenceRow, NotificationRow } from "./notifications.types";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(zod$(markNotificationReadSchema))
  .handler(async ({ data }): Promise<NotificationRow | null> => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.id, data.notificationId), eq(notifications.userId, userId)),
      )
      .returning();

    return updated ?? null;
  });

export const dismissNotification = createServerFn({ method: "POST" })
  .inputValidator(zod$(dismissNotificationSchema))
  .handler(async ({ data }): Promise<NotificationRow | null> => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [updated] = await db
      .update(notifications)
      .set({ dismissedAt: new Date() })
      .where(
        and(eq(notifications.id, data.notificationId), eq(notifications.userId, userId)),
      )
      .returning();

    return updated ?? null;
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateNotificationPreferencesSchema))
  .handler(async ({ data }): Promise<NotificationPreferenceRow | null> => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { notificationPreferences } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.category, data.category),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          channelEmail: data.channelEmail ?? existing.channelEmail,
          channelInApp: data.channelInApp ?? existing.channelInApp,
          emailFrequency: data.emailFrequency ?? existing.emailFrequency,
        })
        .where(eq(notificationPreferences.id, existing.id))
        .returning();

      return updated ?? null;
    }

    const [created] = await db
      .insert(notificationPreferences)
      .values({
        userId,
        category: data.category,
        channelEmail: data.channelEmail ?? true,
        channelInApp: data.channelInApp ?? true,
        emailFrequency: data.emailFrequency ?? "immediate",
      })
      .returning();

    return created ?? null;
  });

export const createNotification = createServerFn({ method: "POST" })
  .inputValidator(zod$(createNotificationSchema))
  .handler(async ({ data }): Promise<NotificationRow | null> => {
    await assertFeatureEnabled("notifications_core");
    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        organizationId: data.organizationId ?? null,
        type: data.type,
        category: data.category,
        title: data.title,
        body: data.body,
        link: data.link ?? null,
        metadata: data.metadata ?? {},
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "NOTIFICATION_CREATE",
        actorUserId: data.userId,
        actorOrgId: data.organizationId ?? null,
        targetType: "notification",
        targetId: created.id,
        targetOrgId: data.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const createNotificationTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(createNotificationTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_notifications");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { notificationTemplates } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(notificationTemplates)
      .values({
        key: data.key,
        category: data.category,
        subject: data.subject,
        bodyTemplate: data.bodyTemplate,
        isSystem: data.isSystem ?? false,
        createdBy: userId,
      })
      .returning();

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "NOTIFICATION_TEMPLATE_CREATE",
        actorUserId: userId,
        targetType: "notification_template",
        targetId: created.id,
      });
    }

    return created ?? null;
  });

export const updateNotificationTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateNotificationTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_notifications");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { notificationTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();

    const [updated] = await db
      .update(notificationTemplates)
      .set({
        key: data.data.key,
        category: data.data.category,
        subject: data.data.subject,
        bodyTemplate: data.data.bodyTemplate,
        isSystem: data.data.isSystem,
      })
      .where(eq(notificationTemplates.id, data.templateId))
      .returning();

    return updated ?? null;
  });

export const deleteNotificationTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteNotificationTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_notifications");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { notificationTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();

    const [deleted] = await db
      .delete(notificationTemplates)
      .where(eq(notificationTemplates.id, data.templateId))
      .returning();

    return deleted ?? null;
  });

export const scheduleNotification = createServerFn({ method: "POST" })
  .inputValidator(zod$(scheduleNotificationSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_notifications");
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { scheduledNotifications } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(scheduledNotifications)
      .values({
        templateKey: data.templateKey,
        userId: data.userId ?? null,
        organizationId: data.organizationId ?? null,
        roleFilter: data.roleFilter ?? null,
        scheduledFor: new Date(data.scheduledFor),
        variables: data.variables ?? {},
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "NOTIFICATION_SCHEDULE_CREATE",
        actorUserId: userId,
        targetType: "scheduled_notification",
        targetId: created.id,
      });
    }

    return created ?? null;
  });
