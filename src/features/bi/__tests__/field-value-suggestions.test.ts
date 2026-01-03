import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFieldValueSuggestions } from "../bi.queries";
import type { DatasetConfig } from "../bi.types";

const getDbMock = vi.fn();
const isGlobalAdminMock = vi.fn();
const getUserRolesMock = vi.fn();

const dataset = vi.hoisted<DatasetConfig>(() => ({
  id: "test",
  name: "Test Dataset",
  baseTable: "test_table",
  requiresOrgScope: false,
  fields: [
    {
      id: "accountId",
      name: "Account ID",
      sourceColumn: "account_id",
      dataType: "uuid",
      allowFilter: true,
      allowGroupBy: true,
    },
    {
      id: "region",
      name: "Region",
      sourceColumn: "region",
      dataType: "string",
      allowFilter: true,
      allowGroupBy: true,
      suggestions: {
        strategy: "require_filters",
        minSearchLength: 2,
      },
    },
    {
      id: "status",
      name: "Status",
      sourceColumn: "status",
      dataType: "string",
      allowFilter: true,
      allowGroupBy: true,
      suggestions: {
        strategy: "disabled",
      },
    },
  ],
}));

vi.mock("../semantic", () => ({
  DATASETS: { test: dataset },
  getDataset: (id: string) => (id === "test" ? dataset : undefined),
}));

vi.mock("~/lib/server/auth", () => ({
  getAuthMiddleware: vi.fn(() => []),
  requireUser: vi.fn(() => ({ id: "user-1" })),
}));

vi.mock("~/tenant/feature-gates", () => ({
  assertFeatureEnabled: vi.fn(),
}));

vi.mock("~/features/roles/permission.service", () => ({
  PermissionService: {
    isGlobalAdmin: (...args: unknown[]) => isGlobalAdminMock(...args),
    getUserRoles: (...args: unknown[]) => getUserRolesMock(...args),
  },
}));

vi.mock("~/lib/auth/guards/org-guard", () => ({
  requireOrganizationAccess: vi.fn(),
}));

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

describe("field value suggestions", () => {
  beforeEach(() => {
    getDbMock.mockReset();
    isGlobalAdminMock.mockReset();
    getUserRolesMock.mockReset();
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([]);
  });

  it("requires search for uuid fields", async () => {
    getDbMock.mockImplementation(() => {
      throw new Error("db should not be called");
    });

    const result = await getFieldValueSuggestions({
      data: {
        datasetId: "test",
        fieldId: "accountId",
      },
      context: { organizationId: null },
    } as { data: unknown; context: { organizationId: string | null } });

    expect(result.values).toEqual([]);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("returns empty when suggestions are disabled", async () => {
    getDbMock.mockImplementation(() => {
      throw new Error("db should not be called");
    });

    const result = await getFieldValueSuggestions({
      data: {
        datasetId: "test",
        fieldId: "status",
        search: "active",
      },
      context: { organizationId: null },
    } as { data: unknown; context: { organizationId: string | null } });

    expect(result.values).toEqual([]);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("requires filters for require_filters fields", async () => {
    getDbMock.mockImplementation(() => {
      throw new Error("db should not be called");
    });

    const result = await getFieldValueSuggestions({
      data: {
        datasetId: "test",
        fieldId: "region",
      },
      context: { organizationId: null },
    } as { data: unknown; context: { organizationId: string | null } });

    expect(result.values).toEqual([]);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("queries when filter context is present", async () => {
    const txExecute = vi.fn(async () => [{ value: "North", count: 12 }]);
    getDbMock.mockResolvedValue({
      transaction: async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    });

    const result = await getFieldValueSuggestions({
      data: {
        datasetId: "test",
        fieldId: "region",
        filters: [{ field: "status", operator: "eq", value: "Active" }],
      },
      context: { organizationId: null },
    } as { data: unknown; context: { organizationId: string | null } });

    expect(result.values).toEqual([{ value: "North", count: 12 }]);
    expect(txExecute).toHaveBeenCalled();
  });
});
