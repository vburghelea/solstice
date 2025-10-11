export type SystemDetailRoute =
  | "/dashboard/systems/$systemId"
  | "/admin/systems/$systemId";

export const DEFAULT_SYSTEM_DETAIL_ROUTE: SystemDetailRoute =
  "/dashboard/systems/$systemId";
