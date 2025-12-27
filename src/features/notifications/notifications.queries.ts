import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listNotificationsSchema } from "./notifications.schemas";
import type { NotificationRow } from "./notifications.types";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const listNotifications = createServerFn({ method: "GET" })
  .inputValidator(zod$(listNotificationsSchema))
  .handler(async ({ data }): Promise<NotificationRow[]> => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const { and, desc, eq, isNull } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = data.unreadOnly
      ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
      : eq(notifications.userId, userId);

    const rows = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        organizationId: notifications.organizationId,
        type: notifications.type,
        category: notifications.category,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
        readAt: notifications.readAt,
        dismissedAt: notifications.dismissedAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(conditions)
      .orderBy(desc(notifications.createdAt))
      .limit(data.limit ?? 25);

    return rows;
  });

export const getUnreadNotificationCount = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return 0;

    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const { and, count, eq, isNull } = await import("drizzle-orm");

    const db = await getDb();
    const [result] = await db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return result?.total ?? 0;
  },
);

export const getNotificationPreferences = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertFeatureEnabled("notifications_core");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { notificationPreferences } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    return db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  },
);

export const listNotificationTemplates = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertFeatureEnabled("sin_admin_notifications");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { notificationTemplates } = await import("~/db/schema");
    const { desc } = await import("drizzle-orm");

    const db = await getDb();
    return db
      .select()
      .from(notificationTemplates)
      .orderBy(desc(notificationTemplates.createdAt));
  },
);
