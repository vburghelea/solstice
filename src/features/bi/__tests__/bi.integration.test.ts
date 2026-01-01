import { beforeEach, describe, expect, it, vi } from "vitest";
import { executePivotQuery } from "../bi.queries";
import { exportPivotResults } from "../bi.mutations";
import * as biData from "../bi.data";
import * as governance from "../governance";

const getDbMock = vi.fn();
const isGlobalAdminMock = vi.fn();
const getUserRolesMock = vi.fn();
const requireOrganizationAccessMock = vi.fn();
const requireRecentAuthMock = vi.fn();
const loadDatasetDataMock = vi.spyOn(biData, "loadDatasetData");

const USER_ID = "22222222-2222-4222-8222-222222222222";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG_ID = "33333333-3333-4333-8333-333333333333";

const schema = vi.hoisted(() => ({
  exportHistory: "exportHistory",
}));

vi.mock("~/lib/server/auth", () => ({
  getAuthMiddleware: vi.fn(() => []),
  requireUser: vi.fn(() => ({ id: USER_ID })),
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
  requireOrganizationAccess: (...args: unknown[]) =>
    requireOrganizationAccessMock(...args),
}));

vi.mock("~/lib/auth/guards/step-up", () => ({
  getCurrentSession: vi.fn().mockResolvedValue({ session: { createdAt: new Date() } }),
  requireRecentAuth: (...args: unknown[]) => requireRecentAuthMock(...args),
}));

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

vi.mock("~/db/schema", () => schema);

describe("bi integration", () => {
  let insertRecords: Array<{ table: unknown; values: unknown }>;

  beforeEach(() => {
    insertRecords = [];
    getDbMock.mockReset();
    isGlobalAdminMock.mockReset();
    getUserRolesMock.mockReset();
    requireOrganizationAccessMock.mockReset();
    requireRecentAuthMock.mockReset();

    loadDatasetDataMock.mockReset();
    loadDatasetDataMock.mockResolvedValue([]);

    vi.spyOn(governance, "logQuery").mockResolvedValue("log-id");
    vi.spyOn(governance, "logExport").mockResolvedValue("log-id");

    getDbMock.mockResolvedValue({
      insert: vi.fn((table: unknown) => ({
        values: vi.fn(async (values: unknown) => {
          insertRecords.push({ table, values });
          return undefined;
        }),
      })),
    });
  });

  it("scopes pivot queries to the active org", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([]);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "reporter",
    });

    loadDatasetDataMock.mockResolvedValue([{ type: "club" }, { type: "club" }]);

    await executePivotQuery({
      data: {
        datasetId: "organizations",
        organizationId: ORG_ID,
        rows: ["type"],
        columns: [],
        measures: [{ field: null, aggregation: "count" }],
        filters: [],
      },
      context: { organizationId: ORG_ID },
    } as { data: unknown; context: { organizationId: string } });

    expect(loadDatasetDataMock).toHaveBeenCalled();
    const call = loadDatasetDataMock.mock.calls[0]?.[0] as {
      filters: Array<{ field: string; operator: string; value: unknown }>;
    };
    expect(call.filters).toEqual(
      expect.arrayContaining([{ field: "id", operator: "eq", value: ORG_ID }]),
    );
  });

  it("rejects org mismatches for non-admin users", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([]);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "reporter",
    });

    await expect(
      executePivotQuery({
        data: {
          datasetId: "organizations",
          organizationId: OTHER_ORG_ID,
          rows: ["type"],
          columns: [],
          measures: [{ field: null, aggregation: "count" }],
          filters: [],
        },
        context: { organizationId: ORG_ID },
      } as { data: unknown; context: { organizationId: string } }),
    ).rejects.toThrow("Organization context mismatch");
  });

  it("requires step-up auth before exporting", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([{ role: { permissions: {} } }]);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "reporter",
    });
    requireRecentAuthMock.mockRejectedValue(new Error("Step-up required"));

    await expect(
      exportPivotResults({
        data: {
          pivotQuery: {
            datasetId: "organizations",
            rows: ["type"],
            columns: [],
            measures: [{ field: null, aggregation: "count" }],
            filters: [],
          },
          format: "csv",
        },
        context: { organizationId: ORG_ID },
      } as { data: unknown; context: { organizationId: string } }),
    ).rejects.toThrow();
  });

  it("logs exports after step-up auth", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([
      { role: { permissions: { "analytics.export": true } } },
    ]);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "reporter",
    });
    requireRecentAuthMock.mockResolvedValue(undefined);

    loadDatasetDataMock.mockResolvedValue([{ type: "club" }, { type: "club" }]);

    const result = await exportPivotResults({
      data: {
        pivotQuery: {
          datasetId: "organizations",
          rows: ["type"],
          columns: [],
          measures: [{ field: null, aggregation: "count" }],
          filters: [],
        },
        format: "csv",
      },
      context: { organizationId: ORG_ID },
    } as { data: unknown; context: { organizationId: string } });

    expect(result?.data).toBeDefined();
    expect(insertRecords.length).toBe(1);
    expect(governance.logExport).toHaveBeenCalled();
  });
});
