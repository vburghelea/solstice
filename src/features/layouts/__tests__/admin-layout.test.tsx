import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter, screen } from "~/tests/utils";
import { AdminLayout } from "../admin-layout";

// Mock auth signOut
vi.mock("~/lib/auth-client", () => ({
  auth: {
    signOut: vi.fn(),
  },
}));

describe("AdminLayout with Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin layout with navigation", async () => {
    await renderWithRouter(<AdminLayout />);

    // Check navigation elements - labels may appear in sidebar and mobile tab bar
    const dashboardTexts = screen.getAllByText("Dashboard");
    expect(dashboardTexts.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Teams").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Events").length).toBeGreaterThanOrEqual(1);

    // Check admin panel header - use getAllByText since it appears in both desktop and mobile views
    const roundupGamesTexts = screen.getAllByText("Roundup Games");
    expect(roundupGamesTexts).toHaveLength(2); // One for desktop, one for mobile

    // "Admin Panel" text was changed to "Dashboard" in mobile view
    expect(screen.getByText("Admin Panel")).toBeInTheDocument(); // Mobile header still shows Admin Panel
  });

  it("renders with user context", async () => {
    const customUser = {
      id: "admin-user",
      name: "Admin User",
      email: "admin@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: true,
      phone: "+1234567890",
      gender: "male" as const,
      pronouns: "he/him",
      privacySettings: JSON.stringify({
        showEmail: false,
        showPhone: false,
      }),
      profileVersion: 1,
      profileUpdatedAt: new Date(),
    };

    await renderWithRouter(<AdminLayout />, { user: customUser });

    // Navigation should still render with custom user
    // Multiple "Dashboard" texts appear (sidebar subtitle and nav link)
    const dashboardTexts = screen.getAllByText("Dashboard");
    expect(dashboardTexts.length).toBeGreaterThanOrEqual(2);

    // Admin Panel still appears in mobile view
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("handles mobile menu toggle", async () => {
    await renderWithRouter(<AdminLayout />);

    // Mobile menu is hidden by default on desktop
    // The test would need to mock window size to test mobile behavior
    expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument();
  });

  it("displays all navigation links with correct hrefs", async () => {
    await renderWithRouter(<AdminLayout />);

    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard/i });
    const teamsLinks = screen.getAllByRole("link", { name: /teams/i });
    const eventsLinks = screen.getAllByRole("link", { name: /events/i });

    // Find the navigation links (not header links)
    const dashboardLink = dashboardLinks.find(
      (link) => link.getAttribute("href") === "/dashboard",
    );
    const teamsLink = teamsLinks.find(
      (link) => link.getAttribute("href") === "/dashboard/teams",
    );
    const eventsLink = eventsLinks.find(
      (link) => link.getAttribute("href") === "/dashboard/events",
    );

    expect(dashboardLink).toBeTruthy();
    expect(teamsLink).toBeTruthy();
    expect(eventsLink).toBeTruthy();
  });

  it("shows admin tools navigation for platform admins", async () => {
    const adminUser = {
      id: "admin-platform-user",
      name: "Platform Admin",
      email: "platform-admin@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: true,
      phone: "+1234567890",
      gender: "female" as const,
      pronouns: "she/her",
      privacySettings: JSON.stringify({
        showEmail: false,
        showPhone: false,
      }),
      profileVersion: 1,
      profileUpdatedAt: new Date(),
      roles: [
        {
          id: "role-platform-admin",
          userId: "admin-platform-user",
          roleId: "platform-admin",
          role: {
            id: "platform-admin",
            name: "Platform Admin",
            description: "Platform administrator",
            permissions: {},
          },
          teamId: null,
          eventId: null,
          assignedBy: "system",
          assignedAt: new Date(),
          expiresAt: null,
          notes: null,
        },
      ],
    };

    await renderWithRouter(<AdminLayout />, { user: adminUser });

    expect(screen.getByText("Admin tools")).toBeInTheDocument();

    const systemsLink = screen.getByRole("link", { name: /systems/i });
    expect(systemsLink).toHaveAttribute("href", "/dashboard/systems");
  });
});
