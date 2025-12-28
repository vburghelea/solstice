import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { syncDataCatalogSchema } from "./data-catalog.schemas";
import { buildCatalogSeedEntries } from "./data-catalog.service";

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

export const syncDataCatalog = createServerFn({ method: "POST" })
  .inputValidator(zod$(syncDataCatalogSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_data_catalog");
    const userId = await requireSessionUserId();

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    const { forbidden } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { dataCatalogEntries } = await import("~/db/schema");

    const db = await getDb();
    const seedEntries = await buildCatalogSeedEntries(
      data.includeTemplates === undefined
        ? undefined
        : { includeTemplates: data.includeTemplates },
    );

    if (seedEntries.length === 0) {
      return { count: 0 };
    }

    await db.transaction(async (tx) => {
      for (const entry of seedEntries) {
        const now = new Date();
        await tx
          .insert(dataCatalogEntries)
          .values({
            organizationId: entry.organizationId,
            sourceType: entry.sourceType,
            sourceId: entry.sourceId,
            title: entry.title,
            description: entry.description,
            tags: entry.tags,
            metadata: entry.metadata,
            sourceUpdatedAt: entry.sourceUpdatedAt,
            createdBy: userId,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [dataCatalogEntries.sourceType, dataCatalogEntries.sourceId],
            set: {
              organizationId: entry.organizationId,
              title: entry.title,
              description: entry.description,
              tags: entry.tags,
              metadata: entry.metadata,
              sourceUpdatedAt: entry.sourceUpdatedAt,
              updatedAt: now,
            },
          });
      }
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "DATA_CATALOG_SYNC",
      actorUserId: userId,
      targetType: "data_catalog",
      metadata: { count: seedEntries.length },
    });

    return { count: seedEntries.length };
  });
