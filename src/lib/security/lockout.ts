import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

export const lockAccount = createServerOnlyFn(
  async (params: {
    userId: string;
    reason: string;
    unlockAt?: Date | null;
    metadata?: JsonRecord;
    actorUserId?: string | null;
  }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { accountLocks } = await import("~/db/schema");

    const db = await getDb();
    const [lock] = await db
      .insert(accountLocks)
      .values({
        userId: params.userId,
        reason: params.reason,
        unlockAt: params.unlockAt ?? null,
        metadata: params.metadata ?? {},
      })
      .returning();

    if (lock) {
      const { logSecurityEvent } = await import("~/lib/audit");
      await logSecurityEvent({
        action: "SECURITY.LOCKOUT",
        actorUserId: params.actorUserId ?? params.userId,
        targetType: "account_lock",
        targetId: lock.id,
        metadata: { reason: params.reason },
      });

      const { PermissionService } = await import("~/features/roles/permission.service");
      const { enqueueNotification } = await import("~/lib/notifications/queue");
      const adminIds = await PermissionService.getGlobalAdminUserIds();

      await Promise.all(
        adminIds
          .filter((adminId) => adminId !== params.userId)
          .map((adminId) =>
            enqueueNotification({
              userId: adminId,
              type: "security_lockout",
              category: "security",
              title: "Account locked",
              body: `A user account was locked due to ${params.reason}.`,
              link: "/dashboard/admin/sin",
              metadata: {
                lockedUserId: params.userId,
                reason: params.reason,
              },
            }),
          ),
      );
    }

    return lock ?? null;
  },
);

export const unlockAccount = createServerOnlyFn(
  async (params: { userId: string; unlockedBy?: string; reason?: string }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { accountLocks } = await import("~/db/schema");
    const { and, eq, isNull } = await import("drizzle-orm");

    const db = await getDb();
    const [lock] = await db
      .update(accountLocks)
      .set({
        unlockedAt: new Date(),
        unlockedBy: params.unlockedBy ?? null,
        unlockReason: params.reason ?? null,
      })
      .where(and(eq(accountLocks.userId, params.userId), isNull(accountLocks.unlockedAt)))
      .returning();

    if (lock) {
      const { logSecurityEvent } = await import("~/lib/audit");
      await logSecurityEvent({
        action: "SECURITY.UNLOCK",
        actorUserId: params.unlockedBy ?? params.userId,
        targetType: "account_lock",
        targetId: lock.id,
        metadata: { reason: params.reason },
      });
    }

    return lock ?? null;
  },
);

export const isAccountLocked = createServerOnlyFn(async (userId: string) => {
  const { getDb } = await import("~/db/server-helpers");
  const { accountLocks } = await import("~/db/schema");
  const { and, eq, isNull, or, gt } = await import("drizzle-orm");

  const db = await getDb();
  const now = new Date();

  const [lock] = await db
    .select()
    .from(accountLocks)
    .where(
      and(
        eq(accountLocks.userId, userId),
        isNull(accountLocks.unlockedAt),
        or(isNull(accountLocks.unlockAt), gt(accountLocks.unlockAt, now)),
      ),
    )
    .limit(1);

  return lock ?? null;
});
