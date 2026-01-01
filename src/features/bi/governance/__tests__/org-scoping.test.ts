import { describe, expect, it } from "vitest";
import type { DatasetConfig, QueryContext } from "../../bi.types";
import { applyOrgScopingFilter, determineOrgScoping } from "../org-scoping";

const baseDataset: DatasetConfig = {
  id: "organizations",
  name: "Organizations",
  baseTable: "organizations",
  fields: [],
  requiresOrgScope: true,
  orgScopeColumn: "organizationId",
};

const baseContext: QueryContext = {
  userId: "user-1",
  organizationId: "org-1",
  orgRole: "reporter",
  isGlobalAdmin: false,
  permissions: new Set(),
  hasRecentAuth: false,
  timestamp: new Date(),
};

describe("determineOrgScoping", () => {
  it("bypasses for global admin", () => {
    const result = determineOrgScoping(
      { ...baseContext, isGlobalAdmin: true },
      baseDataset,
    );
    expect(result.shouldScope).toBe(false);
  });

  it("skips for datasets without org scope", () => {
    const result = determineOrgScoping(baseContext, {
      ...baseDataset,
      requiresOrgScope: false,
    });
    expect(result.shouldScope).toBe(false);
  });

  it("scopes to org for regular users", () => {
    const result = determineOrgScoping(baseContext, baseDataset);
    expect(result.shouldScope).toBe(true);
    expect(result.scopeOrgId).toBe("org-1");
    expect(result.scopeColumn).toBe("organizationId");
  });
});

describe("applyOrgScopingFilter", () => {
  it("filters rows by org id", () => {
    const scoping = determineOrgScoping(baseContext, baseDataset);
    const rows = [
      { organizationId: "org-1", name: "A" },
      { organizationId: "org-2", name: "B" },
    ];
    const result = applyOrgScopingFilter(rows, scoping);
    expect(result).toEqual([{ organizationId: "org-1", name: "A" }]);
  });
});
