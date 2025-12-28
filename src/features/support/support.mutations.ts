import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createSupportRequestSchema,
  respondSupportRequestSchema,
} from "./support.schemas";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    const { unauthorized } = await import("~/lib/server/errors");
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

export const createSupportRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(createSupportRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({ userId, organizationId: data.organizationId });
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(supportRequests)
      .values({
        organizationId: data.organizationId ?? null,
        userId,
        subject: data.subject,
        message: data.message,
        category: data.category,
        status: "open",
      })
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_REQUEST_CREATE",
      actorUserId: userId,
      targetType: "support_request",
      targetId: created.id,
      targetOrgId: created.organizationId ?? null,
    });

    return created;
  });

export const respondSupportRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(respondSupportRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    const { forbidden, notFound } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, data.requestId))
      .limit(1);

    if (!existing) {
      throw notFound("Support request not found");
    }

    const [updated] = await db
      .update(supportRequests)
      .set({
        status: data.status ?? existing.status,
        responseMessage: data.responseMessage ?? existing.responseMessage,
        respondedBy: data.responseMessage ? userId : existing.respondedBy,
        respondedAt: data.responseMessage ? new Date() : existing.respondedAt,
      })
      .where(eq(supportRequests.id, data.requestId))
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_REQUEST_RESPONSE",
      actorUserId: userId,
      targetType: "support_request",
      targetId: updated.id,
      targetOrgId: updated.organizationId ?? null,
    });

    return updated;
  });
