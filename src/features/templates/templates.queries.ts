import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listTemplatesSchema } from "./templates.schemas";

export const listTemplates = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listTemplatesSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_templates");
    const user = requireUser(context);
    const { forbidden } = await import("~/lib/server/errors");
    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const { and, desc, eq, ilike, isNull, or } = await import("drizzle-orm");

    const db = await getDb();
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);

    if (!data.organizationId && !isAdmin) {
      throw forbidden("Organization context required");
    }

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId: user.id,
        organizationId: data.organizationId,
      });
    }

    const conditions = [];

    if (data.organizationId) {
      conditions.push(
        or(
          eq(templates.organizationId, data.organizationId),
          isNull(templates.organizationId),
        ),
      );
    }

    if (data.context) {
      conditions.push(eq(templates.context, data.context));
    }

    if (!data.includeArchived) {
      conditions.push(eq(templates.isArchived, false));
    }

    if (data.search) {
      const term = `%${data.search}%`;
      conditions.push(
        or(ilike(templates.name, term), ilike(templates.description, term)),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select().from(templates).where(where).orderBy(desc(templates.createdAt));
  });
