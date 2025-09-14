import { describe, expect, it } from "vitest";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter, screen } from "~/tests/utils";
import { AdminSidebar } from "../admin-sidebar";

describe("AdminSidebar role-gated items", () => {
  it("shows social audits and reports for admin users", async () => {
    await renderWithRouter(<AdminSidebar />, {
      user: {
        ...MOCK_OWNER_USER,
        roles: [
          {
            id: "user-role-1",
            userId: MOCK_OWNER_USER.id,
            roleId: "role-platform-admin",
            role: {
              id: "role-platform-admin",
              name: "Platform Admin",
              description: null,
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
      },
    });
    // Reports link
    expect(screen.getByRole("link", { name: /Reports/i })).toBeInTheDocument();
    // Social Audits link
    expect(screen.getByRole("link", { name: /Social Audits/i })).toBeInTheDocument();
  });
});

describe("AdminSidebar without admin role", () => {
  it("hides admin-only items for non-admin users", async () => {
    await renderWithRouter(<AdminSidebar />, {
      user: { ...MOCK_OWNER_USER, roles: [] },
    });
    expect(screen.queryByRole("link", { name: /Reports/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Social Audits/i }),
    ).not.toBeInTheDocument();
  });
});
