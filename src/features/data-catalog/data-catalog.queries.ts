import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listDataCatalogEntriesSchema } from "./data-catalog.schemas";

export const listDataCatalogEntries = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listDataCatalogEntriesSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_data_catalog");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);

    if (!data.organizationId && !isAdmin) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Organization context required");
    }

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId: user.id,
        organizationId: data.organizationId,
      });
    }

    const { getDb } = await import("~/db/server-helpers");
    const { dataCatalogEntries } = await import("~/db/schema");
    const { and, asc, eq, ilike, isNull, or } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [];

    if (data.organizationId) {
      conditions.push(
        or(
          eq(dataCatalogEntries.organizationId, data.organizationId),
          isNull(dataCatalogEntries.organizationId),
        ),
      );
    }

    if (data.sourceType) {
      conditions.push(eq(dataCatalogEntries.sourceType, data.sourceType));
    }

    if (data.search) {
      const term = `%${data.search}%`;
      conditions.push(
        or(
          ilike(dataCatalogEntries.title, term),
          ilike(dataCatalogEntries.description, term),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(dataCatalogEntries)
      .where(where)
      .orderBy(asc(dataCatalogEntries.title));
  });
