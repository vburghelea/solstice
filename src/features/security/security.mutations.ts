import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  lockUserSchema,
  recordSecurityEventSchema,
  unlockUserSchema,
} from "./security.schemas";

export const recordSecurityEvent = createServerFn({ method: "POST" })
  .inputValidator(zod$(recordSecurityEventSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("security_core");
    const { recordSecurityEvent: recordEvent } = await import("~/lib/security/events");
    const { applySecurityRules } = await import("~/lib/security/detection");

    let resolvedUserId = data.userId ?? null;

    if (!resolvedUserId && data.identifier) {
      const { getDb } = await import("~/db/server-helpers");
      const { user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      const [record] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, data.identifier.toLowerCase()))
        .limit(1);

      resolvedUserId = record?.id ?? null;
    }

    const event = await recordEvent({
      userId: resolvedUserId,
      eventType: data.eventType,
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    });

    if (resolvedUserId) {
      await applySecurityRules({ userId: resolvedUserId, eventType: data.eventType });
    }

    return event;
  });

export const lockUserAccount = createServerFn({ method: "POST" })
  .inputValidator(zod$(lockUserSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_security");
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    const auth = await getAuth();
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });
    const actorUserId = session?.user?.id ?? null;

    await requireAdmin(actorUserId);

    const { lockAccount } = await import("~/lib/security/lockout");
    return lockAccount({
      userId: data.userId,
      reason: data.reason,
      unlockAt: data.unlockAt ? new Date(data.unlockAt) : null,
      ...(data.metadata ? { metadata: data.metadata } : {}),
      actorUserId: actorUserId ?? null,
    });
  });

export const unlockUserAccount = createServerFn({ method: "POST" })
  .inputValidator(zod$(unlockUserSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_security");
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    const auth = await getAuth();
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });
    const actorUserId = session?.user?.id ?? null;

    await requireAdmin(actorUserId);

    const { unlockAccount } = await import("~/lib/security/lockout");
    return unlockAccount({
      userId: data.userId,
      ...(actorUserId ? { unlockedBy: actorUserId } : {}),
      ...(data.reason ? { reason: data.reason } : {}),
    });
  });
