import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  parentOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const schema = vi.hoisted(() => ({
  organizations: {
    id: "organizations.id",
    name: "organizations.name",
    slug: "organizations.slug",
    type: "organizations.type",
    status: "organizations.status",
    parentOrgId: "organizations.parentOrgId",
    createdAt: "organizations.createdAt",
    updatedAt: "organizations.updatedAt",
  },
  organizationMembers: {
    organizationId: "organizationMembers.organizationId",
    role: "organizationMembers.role",
    userId: "organizationMembers.userId",
    status: "organizationMembers.status",
  },
  delegatedAccess: {
    organizationId: "delegatedAccess.organizationId",
    scope: "delegatedAccess.scope",
    delegateUserId: "delegatedAccess.delegateUserId",
    revokedAt: "delegatedAccess.revokedAt",
    expiresAt: "delegatedAccess.expiresAt",
  },
}));

const getDbMock = vi.hoisted(() => vi.fn());
const isGlobalAdminMock = vi.hoisted(() => vi.fn());

vi.mock("~/db/schema", () => schema);
vi.mock("~/db/server-helpers", () => ({
  getDb: getDbMock,
}));
vi.mock("~/features/roles/permission.service", () => ({
  PermissionService: {
    isGlobalAdmin: (...args: unknown[]) => isGlobalAdminMock(...args),
  },
}));

const { organizations, organizationMembers, delegatedAccess } = schema;

const { listAccessibleOrganizationsForUser, resolveOrganizationAccess } =
  await import("../organizations.access");

const createOrg = (overrides: Partial<OrgRow> = {}): OrgRow => ({
  id: "org",
  name: "Organization",
  slug: "organization",
  type: "club",
  status: "active",
  parentOrgId: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
  ...overrides,
});

let tableData: Map<unknown, unknown[]>;
let selectMock: ReturnType<typeof vi.fn>;

const createQuery = (table: unknown) => {
  const data = tableData.get(table) ?? [];
  const basePromise = Promise.resolve(data);
  return Object.assign(basePromise, {
    where: vi.fn(async () => data),
  });
};

const setTableData = (params: {
  orgs?: OrgRow[];
  members?: Array<{ organizationId: string; role: OrganizationRole }>;
  delegated?: Array<{ organizationId: string; scope: string }>;
}) => {
  tableData = new Map();
  tableData.set(organizations, params.orgs ?? []);
  tableData.set(organizationMembers, params.members ?? []);
  tableData.set(delegatedAccess, params.delegated ?? []);
};

describe("organizations.access", () => {
  beforeEach(() => {
    tableData = new Map();
    selectMock = vi.fn((() => ({
      from: (table: unknown) => createQuery(table),
    })) as () => { from: (table: unknown) => ReturnType<typeof createQuery> });
    getDbMock.mockReset();
    getDbMock.mockResolvedValue({ select: selectMock });
    isGlobalAdminMock.mockReset();
  });

  describe("listAccessibleOrganizationsForUser", () => {
    it("returns all orgs for global admins with admin role", async () => {
      isGlobalAdminMock.mockResolvedValue(true);

      const orgs = [createOrg({ id: "org-1" }), createOrg({ id: "org-2" })];
      setTableData({ orgs });

      const result = await listAccessibleOrganizationsForUser("user-1");

      expect(result.map((org) => org.id)).toEqual(["org-1", "org-2"]);
      expect(result.map((org) => org.role)).toEqual(["admin", "admin"]);
    });

    it("inherits membership role across descendants", async () => {
      isGlobalAdminMock.mockResolvedValue(false);

      const orgRoot = createOrg({ id: "org-root" });
      const orgChild = createOrg({ id: "org-child", parentOrgId: "org-root" });
      const orgLeaf = createOrg({ id: "org-leaf", parentOrgId: "org-child" });
      const orgOther = createOrg({ id: "org-other" });

      setTableData({
        orgs: [orgRoot, orgChild, orgLeaf, orgOther],
        members: [{ organizationId: "org-root", role: "owner" }],
      });

      const result = await listAccessibleOrganizationsForUser("user-1");
      const ids = result.map((org) => org.id).sort();

      expect(ids).toEqual(["org-child", "org-leaf", "org-root"]);
      result.forEach((org) => {
        expect(org.role).toBe("owner");
      });
    });

    it("derives reporter access from delegated scopes", async () => {
      isGlobalAdminMock.mockResolvedValue(false);

      const orgRoot = createOrg({ id: "org-root" });
      const orgChild = createOrg({ id: "org-child", parentOrgId: "org-root" });

      setTableData({
        orgs: [orgRoot, orgChild],
        delegated: [{ organizationId: "org-root", scope: "reporting" }],
      });

      const result = await listAccessibleOrganizationsForUser("user-1");
      const root = result.find((org) => org.id === "org-root");
      const child = result.find((org) => org.id === "org-child");

      expect(root?.role).toBe("reporter");
      expect(root?.delegatedScopes).toEqual(["reporting"]);
      expect(child?.role).toBe("reporter");
      expect(child?.delegatedScopes).toEqual([]);
    });
  });

  describe("resolveOrganizationAccess", () => {
    it("returns admin role for global admins", async () => {
      isGlobalAdminMock.mockResolvedValue(true);

      const orgRoot = createOrg({ id: "org-root" });
      setTableData({ orgs: [orgRoot] });

      await expect(
        resolveOrganizationAccess({ userId: "user-1", organizationId: "org-root" }),
      ).resolves.toEqual({ organizationId: "org-root", role: "admin" });
    });

    it("inherits role from parent membership", async () => {
      isGlobalAdminMock.mockResolvedValue(false);

      const orgRoot = createOrg({ id: "org-root" });
      const orgChild = createOrg({ id: "org-child", parentOrgId: "org-root" });

      setTableData({
        orgs: [orgRoot, orgChild],
        members: [{ organizationId: "org-root", role: "viewer" }],
      });

      await expect(
        resolveOrganizationAccess({ userId: "user-1", organizationId: "org-child" }),
      ).resolves.toEqual({ organizationId: "org-child", role: "viewer" });
    });

    it("returns null when no access exists", async () => {
      isGlobalAdminMock.mockResolvedValue(false);

      const orgRoot = createOrg({ id: "org-root" });
      setTableData({ orgs: [orgRoot] });

      await expect(
        resolveOrganizationAccess({ userId: "user-1", organizationId: "org-root" }),
      ).resolves.toBeNull();
    });

    it("derives delegated access from ancestor scopes", async () => {
      isGlobalAdminMock.mockResolvedValue(false);

      const orgRoot = createOrg({ id: "org-root" });
      const orgChild = createOrg({ id: "org-child", parentOrgId: "org-root" });

      setTableData({
        orgs: [orgRoot, orgChild],
        delegated: [{ organizationId: "org-root", scope: "reporting" }],
      });

      await expect(
        resolveOrganizationAccess({ userId: "user-1", organizationId: "org-child" }),
      ).resolves.toEqual({ organizationId: "org-child", role: "reporter" });
    });
  });
});
