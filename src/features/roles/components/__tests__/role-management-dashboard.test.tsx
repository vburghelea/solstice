import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleManagementData } from "~/features/roles/roles.types";

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

const { RoleManagementDashboard } = await import("../role-management-dashboard");
const { getRoleManagementData } = await import("~/features/roles/roles.queries");

const getRoleManagementDataMock = vi.mocked(getRoleManagementData);

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
      <RoleManagementDashboard />
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
          name: "Solstice Admin",
          description: "Platform administrator",
          permissions: { "system:*": true },
          assignmentCount: 2,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
        },
      ],
      assignments: [
        {
          id: "assignment-1",
          roleId: "solstice-admin",
          roleName: "Solstice Admin",
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
      expect(screen.getAllByText("Solstice Admin").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Platform administrator").length).toBeGreaterThan(0);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
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
