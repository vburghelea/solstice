import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { createContext, use, useEffect, useMemo, useState } from "react";
import { listAccessibleOrganizations } from "~/features/organizations/organizations.queries";
import type { AccessibleOrganization } from "~/features/organizations/organizations.types";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { isFeatureEnabled } from "~/tenant/feature-gates";

type OrgContextValue = {
  activeOrganizationId: string | null;
  organizationRole: OrganizationRole | null;
  accessibleOrganizations: AccessibleOrganization[];
  setActiveOrganizationId: (organizationId: string | null) => void;
  isLoading: boolean;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgContextProvider({ children }: { children: React.ReactNode }) {
  const context = useRouteContext({ strict: false }) as
    | { activeOrganizationId?: string | null }
    | undefined;
  const initialOrgId = context?.activeOrganizationId ?? null;
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(
    initialOrgId,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeOrganizationId) {
      window.localStorage.setItem("active_org_id", activeOrganizationId);
    } else {
      window.localStorage.removeItem("active_org_id");
    }
  }, [activeOrganizationId]);

  const isSinPortalEnabled = isFeatureEnabled("sin_portal");
  const { data = [], isLoading } = useQuery({
    queryKey: ["organizations", "accessible"],
    queryFn: () => listAccessibleOrganizations({ data: null }),
    enabled: isSinPortalEnabled,
  });

  const activeOrganization = useMemo(
    () => data.find((organization) => organization.id === activeOrganizationId) ?? null,
    [activeOrganizationId, data],
  );

  const organizationRole = activeOrganization?.role ?? null;

  return (
    <OrgContext
      value={{
        activeOrganizationId,
        organizationRole,
        accessibleOrganizations: data,
        setActiveOrganizationId,
        isLoading,
      }}
    >
      {children}
    </OrgContext>
  );
}

export const useOrgContext = () => {
  const context = use(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within OrgContextProvider");
  }
  return context;
};
