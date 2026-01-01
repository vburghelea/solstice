import type { QueryContext } from "../bi.types";

const exportPermissions = new Set(["analytics.export", "analytics.admin", "*"]);

export const assertExportAllowed = (context: QueryContext) => {
  const hasPermission = Array.from(context.permissions).some((permission) =>
    exportPermissions.has(permission),
  );

  if (!hasPermission) {
    throw new Error("Analytics export permission required");
  }

  if (!context.hasRecentAuth) {
    throw new Error("Step-up authentication required for export");
  }
};
