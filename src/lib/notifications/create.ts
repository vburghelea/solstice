import { createServerOnlyFn } from "@tanstack/react-start";
import type { CreateNotificationInput } from "~/features/notifications/notifications.schemas";
import type { JsonRecord } from "~/shared/lib/json";

type CreateNotificationParams = CreateNotificationInput & {
  actorUserId?: string | null;
  metadata?: JsonRecord;
};

export const createNotificationInternal = createServerOnlyFn(
  async (params: CreateNotificationParams) => {
    const { assertFeatureEnabled } = await import("~/tenant/feature-gates");
    await assertFeatureEnabled("notifications_core");

    const { getDb } = await import("~/db/server-helpers");
    const { notifications } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        organizationId: params.organizationId ?? null,
        type: params.type,
        category: params.category,
        title: params.title,
        body: params.body,
        link: params.link ?? null,
        metadata: params.metadata ?? {},
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "NOTIFICATION_CREATE",
        actorUserId: params.actorUserId ?? null,
        actorOrgId: params.organizationId ?? null,
        targetType: "notification",
        targetId: created.id,
        targetOrgId: params.organizationId ?? null,
        metadata: {
          notificationType: params.type,
          recipientUserId: params.userId,
        },
      });
    }

    return created ?? null;
  },
);
