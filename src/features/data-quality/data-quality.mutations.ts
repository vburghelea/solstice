import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { runDataQualityCheck } from "./data-quality.monitor";
import { runDataQualitySchema } from "./data-quality.schemas";

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

export const runDataQualityAudit = createServerFn({ method: "POST" })
  .inputValidator(zod$(runDataQualitySchema))
  .handler(async () => {
    await assertFeatureEnabled("sin_data_quality");
    const userId = await requireSessionUserId();

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    const { forbidden } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const result = await runDataQualityCheck();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "DATA_QUALITY_RUN",
      actorUserId: userId,
      targetType: "data_quality",
      metadata: { runId: result.run.id },
    });

    return result;
  });
