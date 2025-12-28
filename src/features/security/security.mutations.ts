import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  lockUserSchema,
  recordSecurityEventSchema,
  unlockUserSchema,
} from "./security.schemas";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const recordSecurityEvent = createServerFn({ method: "POST" })
  .inputValidator(zod$(recordSecurityEventSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("security_core");
    const { unauthorized, forbidden } = await import("~/lib/server/errors");
    const { recordSecurityEvent: recordEvent } = await import("~/lib/security/events");

    const trustedEventTypes = new Set(["logout"]);
    const untrustedEventTypes = new Set<string>();
    const normalizedEventType = data.eventType.toLowerCase();
    const sessionUserId = await getSessionUserId();

    if (!sessionUserId && !untrustedEventTypes.has(normalizedEventType)) {
      throw unauthorized("User not authenticated");
    }

    if (sessionUserId && !trustedEventTypes.has(normalizedEventType)) {
      throw forbidden("Security event type not permitted");
    }

    return recordEvent({
      userId: sessionUserId ?? null,
      eventType: normalizedEventType,
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    });
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
