import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listDataQualityRunsSchema } from "./data-quality.schemas";

export const listDataQualityRuns = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listDataQualityRunsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_data_quality");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    const { forbidden } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { dataQualityRuns } = await import("~/db/schema");
    const { desc } = await import("drizzle-orm");

    const db = await getDb();
    const limit = data.limit ?? 10;

    return db
      .select()
      .from(dataQualityRuns)
      .orderBy(desc(dataQualityRuns.startedAt))
      .limit(limit);
  });
