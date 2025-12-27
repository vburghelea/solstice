import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StepUpProvider } from "~/features/auth/step-up";
import type { RoleManagementData } from "~/features/roles/roles.types";
import { getBrand, getTenantConfig } from "~/tenant";

vi.mock("~/features/roles/roles.queries", () => ({
  getRoleManagementData: vi.fn(),
  searchRoleEligibleUsers: vi.fn(),
}));

vi.mock("~/features/roles/roles.mutations", () => ({
  assignRoleToUser: vi.fn(async () => ({ success: true })),
  removeRoleAssignment: vi.fn(async () => ({ success: true })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("~/lib/auth-client", () => ({
  auth: {
    getSession: vi
      .fn()
      .mockResolvedValue({ data: { user: { email: "test@example.com" } } }),
    signIn: { email: vi.fn() },
    twoFactor: { verifyTotp: vi.fn() },
  },
}));

const { RoleManagementDashboard } = await import("../role-management-dashboard");
const { getRoleManagementData } = await import("~/features/roles/roles.queries");

const getRoleManagementDataMock = vi.mocked(getRoleManagementData);
const tenantConfig = getTenantConfig();
const platformRoleName = tenantConfig.admin.globalRoleNames[0];
const brand = getBrand();

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <StepUpProvider>
        <RoleManagementDashboard />
      </StepUpProvider>
    </QueryClientProvider>,
  );
}

describe("RoleManagementDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders role summaries and assignments", async () => {
    const sampleData: RoleManagementData = {
      roles: [
        {
          id: "solstice-admin",
          name: platformRoleName,
          description: "Platform administrator",
          permissions: { "system:*": true },
          assignmentCount: 2,
          requiresMfa: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
        },
      ],
      assignments: [
        {
          id: "assignment-1",
          roleId: "solstice-admin",
          roleName: platformRoleName,
          roleDescription: "Platform administrator",
          userId: "user-1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          teamId: null,
          eventId: null,
          assignedBy: "assigner-1",
          assignedByName: "Seeder",
          assignedByEmail: "seeder@example.com",
          assignedAt: new Date("2024-02-01T12:00:00Z"),
          expiresAt: null,
          notes: "Seeded",
        },
      ],
    };

    getRoleManagementDataMock.mockResolvedValue({ success: true, data: sampleData });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(platformRoleName).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(
        `Assign and revoke administrator access across ${brand.name} and teams.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Platform administrator").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("2 assigned")).toBeInTheDocument();
  });

  it("shows an error alert when loading fails", async () => {
    getRoleManagementDataMock.mockRejectedValue(new Error("boom"));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Could not load roles")).toBeInTheDocument();
    });
  });
});
