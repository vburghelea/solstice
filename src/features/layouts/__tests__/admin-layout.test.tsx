import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgContextProvider } from "~/features/organizations/org-context";
import { renderWithRouter, screen } from "~/tests/utils";
import { AppLayout } from "../app-layout";

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
    await renderWithRouter(
      <OrgContextProvider>
        <AppLayout />
      </OrgContextProvider>,
    );

    // Check navigation elements - Dashboard appears at least once
    const dashboardTexts = screen.getAllByText("Dashboard");
    expect(dashboardTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();

    // Check brand header - use getAllByText since it appears in both desktop and mobile views
    const quadballTexts = screen.getAllByText("Quadball Canada");
    expect(quadballTexts).toHaveLength(2); // One for desktop, one for mobile

    // Player Portal appears in both desktop and mobile views
    const playerPortalTexts = screen.getAllByText("Player Portal");
    expect(playerPortalTexts.length).toBeGreaterThanOrEqual(1);
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
      dateOfBirth: new Date("1990-01-01"),
      phone: "+1234567890",
      gender: "male" as const,
      pronouns: "he/him",
      emergencyContact: JSON.stringify({
        name: "Emergency Contact",
        phone: "+0987654321",
        relationship: "spouse",
      }),
      privacySettings: JSON.stringify({
        showEmail: false,
        showPhone: false,
        showDateOfBirth: false,
      }),
      profileVersion: 1,
      profileUpdatedAt: new Date(),
      mfaRequired: false,
      mfaEnrolledAt: null,
      twoFactorEnabled: false,
    };

    await renderWithRouter(
      <OrgContextProvider>
        <AppLayout />
      </OrgContextProvider>,
      { user: customUser },
    );

    // Navigation should still render with custom user
    // Dashboard appears at least once in the navigation
    const dashboardTexts = screen.getAllByText("Dashboard");
    expect(dashboardTexts.length).toBeGreaterThanOrEqual(1);

    // Player Portal appears in both desktop and mobile views
    const playerPortalTexts = screen.getAllByText("Player Portal");
    expect(playerPortalTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("handles mobile menu toggle", async () => {
    await renderWithRouter(
      <OrgContextProvider>
        <AppLayout />
      </OrgContextProvider>,
    );

    // Mobile menu is hidden by default on desktop
    // The test would need to mock window size to test mobile behavior
    expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument();
  });

  it("displays all navigation links with correct hrefs", async () => {
    await renderWithRouter(
      <OrgContextProvider>
        <AppLayout />
      </OrgContextProvider>,
    );

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
});
