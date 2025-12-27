import { Home } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavItem } from "~/features/layouts/nav.types";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { AuthUser } from "~/lib/auth/types";
import { qcTenant } from "~/tenant/tenants/qc";
import { viasportTenant } from "~/tenant/tenants/viasport";

let activeTenant = qcTenant;

const isAdminClientMock = vi.fn();

vi.mock("~/tenant", () => ({
  getTenantConfig: () => activeTenant,
}));

vi.mock("~/lib/auth/utils/admin-check", () => ({
  isAdminClient: (...args: unknown[]) => isAdminClientMock(...args),
}));

vi.mock("~/lib/server/errors", () => ({
  forbidden: (message: string) => new Error(message),
}));

const { isFeatureEnabled, assertFeatureEnabled, requireFeatureInRoute, filterNavItems } =
  await import("~/tenant/feature-gates");

describe("feature gates", () => {
  beforeEach(() => {
    activeTenant = qcTenant;
    isAdminClientMock.mockReset();
  });

  it("reports feature availability from tenant config", () => {
    expect(isFeatureEnabled("qc_portal")).toBe(true);
    expect(isFeatureEnabled("sin_portal")).toBe(false);

    activeTenant = viasportTenant;
    expect(isFeatureEnabled("sin_portal")).toBe(true);
    expect(isFeatureEnabled("qc_portal")).toBe(false);
  });

  it("throws on disabled feature", async () => {
    await expect(assertFeatureEnabled("sin_portal")).rejects.toThrow(
      "Feature not enabled for this tenant",
    );
    await expect(assertFeatureEnabled("qc_portal")).resolves.toBeUndefined();
  });

  it("requireFeatureInRoute throws for disabled features", () => {
    let thrown: unknown = null;
    try {
      requireFeatureInRoute("sin_portal");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeTruthy();
    expect(() => requireFeatureInRoute("qc_portal")).not.toThrow();
  });

  it("filters nav items by feature, admin, and org role", () => {
    const items: NavItem[] = [
      { label: "QC Portal", to: "/qc", icon: Home, feature: "qc_portal" },
      { label: "SIN Portal", to: "/sin", icon: Home, feature: "sin_portal" },
      { label: "Admin", to: "/admin", icon: Home, requiresGlobalAdmin: true },
      {
        label: "Analytics",
        to: "/analytics",
        icon: Home,
        requiresOrgRole: "reporter",
      },
    ];

    const user = { roles: [] } as unknown as AuthUser;

    isAdminClientMock.mockReturnValue(false);
    const filtered = filterNavItems(items, {
      user,
      organizationRole: "reporter" as OrganizationRole,
    });

    expect(filtered.map((item) => item.label)).toEqual(["QC Portal", "Analytics"]);

    isAdminClientMock.mockReturnValue(true);
    const filteredAdmin = filterNavItems(items, {
      user,
      organizationRole: null,
    });

    expect(filteredAdmin.map((item) => item.label)).toEqual(["QC Portal", "Admin"]);
  });
});
