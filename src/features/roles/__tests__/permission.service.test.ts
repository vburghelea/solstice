import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTenantConfig } from "~/tenant";
import { isAnyAdmin, PermissionService, userHasRole } from "../permission.service";

// Mock the database
const mockDbInstance = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock("~/db", () => ({
  db: vi.fn(() => mockDbInstance),
}));

const tenantConfig = getTenantConfig();
const platformRoleName = tenantConfig.admin.globalRoleNames[0];
const tenantRoleName =
  tenantConfig.admin.globalRoleNames[1] ?? tenantConfig.admin.globalRoleNames[0];

describe("PermissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock chain
    mockDbInstance.select.mockReturnThis();
    mockDbInstance.from.mockReturnThis();
    mockDbInstance.innerJoin.mockReturnThis();
    mockDbInstance.where.mockReturnThis();
    mockDbInstance.limit.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isGlobalAdmin", () => {
    it("should return true for platform admin role", async () => {
      const mockResult = [{ id: "role-1", name: platformRoleName }];
      mockDbInstance.limit.mockResolvedValueOnce(mockResult);

      const result = await PermissionService.isGlobalAdmin("user-123");
      expect(result).toBe(true);
    });

    it("should return true for tenant admin role", async () => {
      const mockResult = [{ id: "role-2", name: tenantRoleName }];
      mockDbInstance.limit.mockResolvedValueOnce(mockResult);

      const result = await PermissionService.isGlobalAdmin("user-123");
      expect(result).toBe(true);
    });

    it("should return false for non-admin users", async () => {
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const result = await PermissionService.isGlobalAdmin("user-123");
      expect(result).toBe(false);
    });
  });

  describe("canManageTeam", () => {
    it("should return true for global admins", async () => {
      // Mock isGlobalAdmin to return true
      vi.spyOn(PermissionService, "isGlobalAdmin").mockResolvedValue(true);

      const result = await PermissionService.canManageTeam("user-123", "team-456");
      expect(result).toBe(true);
    });

    it("should return true for team-specific admin", async () => {
      // Mock isGlobalAdmin to return false
      vi.spyOn(PermissionService, "isGlobalAdmin").mockResolvedValue(false);

      // Mock team admin query
      const mockResult = [{ id: "role-3", name: "Team Admin", teamId: "team-456" }];
      mockDbInstance.limit.mockResolvedValueOnce(mockResult);

      const result = await PermissionService.canManageTeam("user-123", "team-456");
      expect(result).toBe(true);
    });

    it("should return false for non-admin users", async () => {
      vi.spyOn(PermissionService, "isGlobalAdmin").mockResolvedValue(false);
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const result = await PermissionService.canManageTeam("user-123", "team-456");
      expect(result).toBe(false);
    });
  });

  describe("getUserRoles", () => {
    it("should return all roles for a user", async () => {
      const mockRoles = [
        {
          id: "ur-1",
          userId: "user-123",
          roleId: "role-1",
          teamId: null,
          eventId: null,
          assignedBy: "admin-123",
          assignedAt: new Date(),
          expiresAt: null,
          notes: null,
          role: {
            id: "role-1",
            name: platformRoleName,
            description: "Platform admin",
            permissions: { "*": true },
          },
        },
      ];

      // Mock the where method to return the roles
      mockDbInstance.where.mockResolvedValueOnce(mockRoles);

      const result = await PermissionService.getUserRoles("user-123");
      expect(result).toEqual(mockRoles);
    });
  });
});

describe("Client-side helpers", () => {
  describe("userHasRole", () => {
    const mockUser = {
      roles: [
        {
          role: { name: platformRoleName },
          teamId: null,
          eventId: null,
        },
        {
          role: { name: "Team Admin" },
          teamId: "team-123",
          eventId: null,
        },
      ],
    };

    it("should return true when user has global role", () => {
      expect(userHasRole(mockUser, platformRoleName)).toBe(true);
    });

    it("should return true when user has team-specific role", () => {
      expect(userHasRole(mockUser, "Team Admin", { teamId: "team-123" })).toBe(true);
    });

    it("should return false when user lacks role", () => {
      expect(userHasRole(mockUser, "Event Admin")).toBe(false);
    });

    it("should return false when user lacks scoped role", () => {
      expect(userHasRole(mockUser, "Team Admin", { teamId: "team-999" })).toBe(false);
    });

    it("should return false when user has no roles", () => {
      expect(userHasRole({ roles: [] }, platformRoleName)).toBe(false);
      expect(userHasRole({}, platformRoleName)).toBe(false);
    });
  });

  describe("isAnyAdmin", () => {
    it("should return true for users with admin roles", () => {
      const adminUser = {
        roles: [{ role: { name: "Team Admin" } }],
      };
      expect(isAnyAdmin(adminUser)).toBe(true);
    });

    it("should return false for users without admin roles", () => {
      const regularUser = {
        roles: [{ role: { name: "Player" } }],
      };
      expect(isAnyAdmin(regularUser)).toBe(false);
    });

    it("should return false for users with no roles", () => {
      expect(isAnyAdmin({ roles: [] })).toBe(false);
      expect(isAnyAdmin({})).toBe(false);
    });
  });
});
