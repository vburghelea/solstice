import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
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
    | { activeOrganizationId?: string | null; user?: { id?: string } | null }
    | undefined;
  const initialOrgId = context?.activeOrganizationId ?? null;
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(
    initialOrgId,
  );

  const setActiveOrganizationId = useCallback((organizationId: string | null) => {
    if (typeof window !== "undefined") {
      if (organizationId) {
        window.localStorage.setItem("active_org_id", organizationId);
      } else {
        window.localStorage.removeItem("active_org_id");
      }
    }
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setActiveOrganizationIdState(organizationId);
  }, []);

  useEffect(() => {
    // Sync local org selection when route context changes.
    setActiveOrganizationId(initialOrgId);
  }, [initialOrgId, setActiveOrganizationId]);

  const isSinPortalEnabled = isFeatureEnabled("sin_portal");
  const userId = context?.user?.id ?? null;
  const { data = [], isLoading } = useQuery({
    queryKey: ["organizations", "accessible", userId],
    queryFn: () => listAccessibleOrganizations({ data: null }),
    enabled: isSinPortalEnabled && Boolean(userId),
  });

  const activeOrganization = useMemo(
    () => data.find((organization) => organization.id === activeOrganizationId) ?? null,
    [activeOrganizationId, data],
  );

  const organizationRole = activeOrganization?.role ?? null;
  const contextValue = useMemo(
    () => ({
      activeOrganizationId,
      organizationRole,
      accessibleOrganizations: data,
      setActiveOrganizationId,
      isLoading,
    }),
    [activeOrganizationId, organizationRole, data, setActiveOrganizationId, isLoading],
  );

  return <OrgContext value={contextValue}>{children}</OrgContext>;
}

export const useOrgContext = () => {
  const context = use(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within OrgContextProvider");
  }
  return context;
};
