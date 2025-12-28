import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateReportingSubmission } from "../reporting.mutations";

const getDbMock = vi.fn();
const isGlobalAdminMock = vi.fn();
const requireOrganizationAccessMock = vi.fn();

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ORG_ID = "22222222-2222-4222-8222-222222222222";
const SUBMISSION_ID = "33333333-3333-4333-8333-333333333333";
const FORM_SUBMISSION_ID = "44444444-4444-4444-8444-444444444444";
const FORM_VERSION_ID = "55555555-5555-4555-8555-555555555555";
const FORM_ID = "66666666-6666-4666-8666-666666666666";

const schema = vi.hoisted(() => ({
  reportingSubmissions: "reportingSubmissions",
  reportingSubmissionHistory: "reportingSubmissionHistory",
  reportingTasks: "reportingTasks",
  formSubmissions: "formSubmissions",
  formSubmissionVersions: "formSubmissionVersions",
}));

vi.mock("~/tenant/feature-gates", () => ({
  assertFeatureEnabled: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: new Headers() }),
}));

vi.mock("~/lib/auth/server-helpers", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => ({ user: { id: USER_ID } }),
    },
  }),
}));

vi.mock("~/features/roles/permission.service", () => ({
  PermissionService: {
    isGlobalAdmin: (...args: unknown[]) => isGlobalAdminMock(...args),
  },
}));

vi.mock("~/lib/auth/guards/org-guard", () => ({
  ORG_ADMIN_ROLES: ["owner", "admin"],
  requireOrganizationAccess: (...args: unknown[]) =>
    requireOrganizationAccessMock(...args),
}));

vi.mock("~/lib/audit", () => ({
  logDataChange: vi.fn(),
}));

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

vi.mock("~/db/schema", () => schema);

const {
  reportingSubmissions,
  reportingSubmissionHistory,
  formSubmissions,
  formSubmissionVersions,
} = schema;

describe("reporting submission integration", () => {
  let updateRecords: Array<{ table: unknown; values: unknown }>;
  let insertRecords: Array<{ table: unknown; values: unknown }>;
  let tableData: Map<unknown, unknown[]>;

  beforeEach(() => {
    updateRecords = [];
    insertRecords = [];
    tableData = new Map();
    isGlobalAdminMock.mockReset();
    requireOrganizationAccessMock.mockReset();

    tableData.set(reportingSubmissions, [
      {
        id: SUBMISSION_ID,
        organizationId: ORG_ID,
        status: "in_progress",
        submittedAt: null,
        submittedBy: null,
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
        formSubmissionId: null,
        formId: FORM_ID,
      },
    ]);
    tableData.set(formSubmissions, [
      {
        id: FORM_SUBMISSION_ID,
        formId: FORM_ID,
        organizationId: ORG_ID,
      },
    ]);
    tableData.set(formSubmissionVersions, [
      {
        id: FORM_VERSION_ID,
        submissionId: FORM_SUBMISSION_ID,
      },
    ]);

    const createQuery = (table: unknown) => {
      const data = tableData.get(table) ?? [];
      return {
        innerJoin: () => createQuery(table),
        where: () => ({
          limit: vi.fn().mockResolvedValue(data),
        }),
      };
    };

    const db = {
      select: vi.fn(() => ({
        from: (table: unknown) => createQuery(table),
      })),
      update: vi.fn((table: unknown) => ({
        set: (values: unknown) => {
          updateRecords.push({ table, values });
          return {
            where: () => ({
              returning: vi.fn().mockResolvedValue([
                {
                  id: SUBMISSION_ID,
                  organizationId: ORG_ID,
                  status: "submitted",
                },
              ]),
            }),
          };
        },
      })),
      insert: vi.fn((table: unknown) => ({
        values: vi.fn(async (values: unknown) => {
          insertRecords.push({ table, values });
          return undefined;
        }),
      })),
    };

    getDbMock.mockResolvedValue(db);
  });

  it("links form submissions when updating reporting submission", async () => {
    isGlobalAdminMock.mockResolvedValue(false);

    await updateReportingSubmission({
      data: {
        submissionId: SUBMISSION_ID,
        status: "submitted",
        formSubmissionId: FORM_SUBMISSION_ID,
        formSubmissionVersionId: FORM_VERSION_ID,
      },
    });

    expect(requireOrganizationAccessMock).toHaveBeenCalledWith(
      { userId: USER_ID, organizationId: ORG_ID },
      { roles: ["owner", "admin", "reporter"] },
    );

    const update = updateRecords.find((record) => record.table === reportingSubmissions);
    expect(update?.values).toMatchObject({
      formSubmissionId: FORM_SUBMISSION_ID,
      submittedBy: USER_ID,
      submittedAt: expect.any(Date),
    });

    const history = insertRecords.find(
      (record) => record.table === reportingSubmissionHistory,
    );
    expect(history?.values).toMatchObject({
      reportingSubmissionId: SUBMISSION_ID,
      action: "submitted",
      formSubmissionVersionId: FORM_VERSION_ID,
    });
  });
});
