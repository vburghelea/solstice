import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";

const biTelemetrySchema = z.object({
  event: z.enum([
    "pivot.query.run",
    "pivot.query.fail",
    "pivot.export.attempt",
    "pivot.export.fail",
    "dashboard.view",
  ]),
  datasetId: z.string().optional(),
  dashboardId: z.string().optional(),
  widgetId: z.string().optional(),
  chartType: z.string().optional(),
  rowCount: z.number().int().nonnegative().optional(),
  errorType: z.string().optional(),
});

export type BiTelemetryEvent = z.infer<typeof biTelemetrySchema>;

export const logBiTelemetryEvent = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(biTelemetrySchema.parse)
  .handler(async ({ data, context }) => {
    const user = requireUser(context);
    const { logAuditEntry } = await import("~/lib/audit");

    const organizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    await logAuditEntry({
      action: `BI.${data.event}`,
      actionCategory: "DATA",
      actorUserId: user.id,
      actorOrgId: organizationId,
      targetType: data.dashboardId
        ? "bi_dashboard"
        : data.datasetId
          ? "bi_dataset"
          : null,
      targetId: data.dashboardId ?? data.datasetId ?? null,
      metadata: {
        ...(data.datasetId ? { datasetId: data.datasetId } : {}),
        ...(data.dashboardId ? { dashboardId: data.dashboardId } : {}),
        ...(data.widgetId ? { widgetId: data.widgetId } : {}),
        ...(data.chartType ? { chartType: data.chartType } : {}),
        ...(typeof data.rowCount === "number" ? { rowCount: data.rowCount } : {}),
        ...(data.errorType ? { errorType: data.errorType } : {}),
      },
    });

    return { success: true as const };
  });
