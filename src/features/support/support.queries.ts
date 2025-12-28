import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listSupportRequestsSchema } from "./support.schemas";

export const listMySupportRequests = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listSupportRequestsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_support");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");
    const { and, desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [eq(supportRequests.userId, user.id)];

    if (data.organizationId) {
      conditions.push(eq(supportRequests.organizationId, data.organizationId));
    }

    if (data.status) {
      conditions.push(eq(supportRequests.status, data.status));
    }

    return db
      .select()
      .from(supportRequests)
      .where(and(...conditions))
      .orderBy(desc(supportRequests.createdAt));
  });

export const listSupportRequestsAdmin = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listSupportRequestsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_support");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    const { forbidden } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");
    const { and, desc, eq, ilike, or } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [];

    if (data.organizationId) {
      conditions.push(eq(supportRequests.organizationId, data.organizationId));
    }

    if (data.status) {
      conditions.push(eq(supportRequests.status, data.status));
    }

    if (data.search) {
      const term = `%${data.search}%`;
      conditions.push(
        or(ilike(supportRequests.subject, term), ilike(supportRequests.message, term)),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(supportRequests)
      .where(where)
      .orderBy(desc(supportRequests.createdAt));
  });
