import type { QueryClient } from "@tanstack/react-query";

export const clearActiveOrganizationState = (
  queryClient: QueryClient,
  setActiveOrganizationId?: (organizationId: string | null) => void,
) => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("active_org_id");
  }

  if (setActiveOrganizationId) {
    setActiveOrganizationId(null);
  }

  queryClient.removeQueries({ queryKey: ["organizations"] });
};
