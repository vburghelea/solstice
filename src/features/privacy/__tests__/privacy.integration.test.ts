import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPrivacyExportDownloadUrl } from "../privacy.queries";

const getDbMock = vi.fn();
const requireAdminMock = vi.fn();

const sessionUser = vi.hoisted(() => ({
  value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
}));
const USER_ID = sessionUser.value;
const OTHER_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const schema = vi.hoisted(() => ({
  privacyRequests: "privacyRequests",
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
      getSession: async () => ({ user: { id: sessionUser.value } }),
    },
  }),
}));

vi.mock("~/lib/auth/utils/admin-check", () => ({
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}));

vi.mock("~/lib/storage/artifacts", () => ({
  getArtifactsBucketName: async () => "test-bucket",
  getS3Client: async () => ({}),
}));

vi.mock("~/lib/audit", () => ({
  logExportEvent: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: async () => "https://signed.example.com",
}));

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

vi.mock("~/db/schema", () => schema);

const { privacyRequests } = schema;

describe("privacy export gating", () => {
  let tableData: Map<unknown, unknown[]>;

  beforeEach(() => {
    tableData = new Map();
    requireAdminMock.mockReset();

    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValue(tableData.get(privacyRequests) ?? []),
          }),
        }),
      })),
    };

    getDbMock.mockResolvedValue(db);
  });

  it("allows owners to fetch export URLs without admin", async () => {
    sessionUser.value = USER_ID;
    tableData.set(privacyRequests, [
      {
        id: REQUEST_ID,
        userId: USER_ID,
        type: "export",
        status: "completed",
        resultUrl: "s3://test-bucket/path",
        resultExpiresAt: null,
      },
    ]);

    const result = await getPrivacyExportDownloadUrl({
      data: { requestId: REQUEST_ID },
    });

    expect(result).toBe("https://signed.example.com");
    expect(requireAdminMock).not.toHaveBeenCalled();
  });

  it("requires admin for non-owner access", async () => {
    sessionUser.value = OTHER_USER_ID;
    tableData.set(privacyRequests, [
      {
        id: REQUEST_ID,
        userId: USER_ID,
        type: "export",
        status: "completed",
        resultUrl: "s3://test-bucket/path",
        resultExpiresAt: null,
      },
    ]);
    requireAdminMock.mockRejectedValue(new Error("Admin access required"));

    await expect(
      getPrivacyExportDownloadUrl({ data: { requestId: REQUEST_ID } }),
    ).rejects.toThrow("Admin access required");
  });
});
