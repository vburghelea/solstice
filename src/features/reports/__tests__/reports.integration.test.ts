import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportReport } from "../reports.mutations";
import { listSavedReports } from "../reports.queries";

const getDbMock = vi.fn();
const isGlobalAdminMock = vi.fn();
const getUserRolesMock = vi.fn();
const requireOrganizationAccessMock = vi.fn();

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const REPORT_ID = "33333333-3333-4333-8333-333333333333";
const FORM_VERSION_ID = "44444444-4444-4444-8444-444444444444";
const SUBMISSION_ID = "55555555-5555-4555-8555-555555555555";

const schema = vi.hoisted(() => ({
  savedReports: "savedReports",
  organizations: "organizations",
  reportingSubmissions: "reportingSubmissions",
  formSubmissions: "formSubmissions",
  formVersions: "formVersions",
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
  requireRecentAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/lib/audit", () => ({
  logExportEvent: vi.fn(),
}));

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

vi.mock("~/db/schema", () => schema);

const { savedReports, organizations, formSubmissions, formVersions } = schema;

describe("reports integration", () => {
  let tableData: Map<unknown, unknown[]>;
  let selectMock: ReturnType<typeof vi.fn>;
  let insertRecords: Array<{ table: unknown; values: unknown }>;

  const createQuery = (table: unknown) => {
    const data = tableData.get(table) ?? [];
    const basePromise = Promise.resolve(data);
    return Object.assign(basePromise, {
      where: vi.fn(async () => data),
    });
  };

  const setTableData = (params: {
    saved?: unknown[];
    orgs?: unknown[];
    submissions?: unknown[];
    versions?: unknown[];
  }) => {
    tableData = new Map();
    tableData.set(savedReports, params.saved ?? []);
    tableData.set(organizations, params.orgs ?? []);
    tableData.set(formSubmissions, params.submissions ?? []);
    tableData.set(formVersions, params.versions ?? []);
  };

  beforeEach(() => {
    tableData = new Map();
    insertRecords = [];
    selectMock = vi.fn((() => ({
      from: (table: unknown) => createQuery(table),
    })) as () => { from: (table: unknown) => ReturnType<typeof createQuery> });

    getDbMock.mockReset();
    getDbMock.mockResolvedValue({
      select: selectMock,
      insert: vi.fn((table: unknown) => ({
        values: vi.fn(async (values: unknown) => {
          insertRecords.push({ table, values });
          return undefined;
        }),
      })),
    });

    isGlobalAdminMock.mockReset();
    getUserRolesMock.mockReset();
    requireOrganizationAccessMock.mockReset();
  });

  it("requires org access when scoping saved reports by org", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "owner",
    });

    const saved = [{ id: REPORT_ID }];
    setTableData({ saved });

    const result = await listSavedReports({
      data: { organizationId: ORG_ID },
    });

    expect(requireOrganizationAccessMock).toHaveBeenCalledWith(
      { userId: USER_ID, organizationId: ORG_ID },
      { roles: ["owner", "admin", "reporter"] },
    );
    expect(result).toEqual(saved);
  });

  it("redacts PII payload fields for non-privileged exports", async () => {
    isGlobalAdminMock.mockResolvedValue(false);
    getUserRolesMock.mockResolvedValue([]);
    requireOrganizationAccessMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "reporter",
    });

    setTableData({
      submissions: [
        {
          id: SUBMISSION_ID,
          organizationId: ORG_ID,
          formVersionId: FORM_VERSION_ID,
          payload: {
            email: "user@example.com",
            name: "Jane",
          },
        },
      ],
      versions: [
        {
          id: FORM_VERSION_ID,
          definition: {
            fields: [
              {
                key: "email",
                type: "email",
                label: "Email",
                required: true,
                dataClassification: "personal",
              },
              {
                key: "name",
                type: "text",
                label: "Name",
                required: true,
                dataClassification: "none",
              },
            ],
            settings: { allowDraft: true, requireApproval: false, notifyOnSubmit: [] },
          },
        },
      ],
    });

    const result = await exportReport({
      data: {
        dataSource: "form_submissions",
        exportType: "csv",
        filters: {},
        columns: ["id", "payload"],
      },
      context: { organizationId: ORG_ID },
    } as { data: unknown; context: { organizationId: string } });

    expect(result?.data).toContain("[REDACTED]");
    expect(result?.data).not.toContain("user@example.com");
  });

  it("keeps PII payload fields for users with permissions", async () => {
    isGlobalAdminMock.mockResolvedValue(true);
    getUserRolesMock.mockResolvedValue([{ role: { permissions: { "pii.read": true } } }]);

    setTableData({
      submissions: [
        {
          id: SUBMISSION_ID,
          organizationId: ORG_ID,
          formVersionId: FORM_VERSION_ID,
          payload: {
            email: "admin@example.com",
            name: "Admin",
          },
        },
      ],
      versions: [
        {
          id: FORM_VERSION_ID,
          definition: {
            fields: [
              {
                key: "email",
                type: "email",
                label: "Email",
                required: true,
                dataClassification: "personal",
              },
              {
                key: "name",
                type: "text",
                label: "Name",
                required: true,
                dataClassification: "none",
              },
            ],
            settings: { allowDraft: true, requireApproval: false, notifyOnSubmit: [] },
          },
        },
      ],
    });

    const result = await exportReport({
      data: {
        dataSource: "form_submissions",
        exportType: "csv",
        filters: {},
        columns: ["id", "payload"],
        organizationId: ORG_ID,
      },
      context: {},
    } as { data: unknown; context: Record<string, unknown> });

    expect(result?.data).toContain("admin@example.com");
  });
});
