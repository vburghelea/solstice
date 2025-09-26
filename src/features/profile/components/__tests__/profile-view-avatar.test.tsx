import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithRouter } from "~/tests/utils/router";

vi.mock("~/features/profile/profile.queries", () => ({
  getUserProfile: vi.fn(async () => ({
    success: true,
    data: {
      id: "u1",
      name: "Header User",
      email: "header@example.com",
      image: null,
      uploadedAvatarPath: "/api/avatars/u1.webp",
      profileComplete: true,
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      isGM: false,
      gamesHosted: 0,
      responseRate: 0,
      profileVersion: 1,
    },
  })),
}));

vi.mock("../../profile.queries", () => ({
  getUserProfile: vi.fn(async () => ({
    success: true,
    data: {
      id: "u1",
      name: "Header User",
      email: "header@example.com",
      image: null,
      uploadedAvatarPath: "/api/avatars/u1.webp",
      profileComplete: true,
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      isGM: false,
      gamesHosted: 0,
      responseRate: 0,
      profileVersion: 1,
    },
  })),
}));

describe("ProfileView avatar display", () => {
  it("shows avatar in header in view mode and shows upload UI only in edit mode", async () => {
    const { ProfileView } = await import("../profile-view");
    const { container } = await renderWithRouter(<ProfileView />, {
      path: "/test",
      initialEntries: ["/test"],
      includeQueryClient: true,
    });

    await screen.findByRole("button", { name: /Edit Basic Information/i });

    await waitFor(() => {
      expect(
        container.querySelector("[data-slot='card-header'] [data-slot='avatar']"),
      ).toBeTruthy();
    });
    expect(
      screen.queryByRole("button", { name: /upload avatar/i }),
    ).not.toBeInTheDocument();

    const editBtn = screen.getByRole("button", { name: /Edit Basic Information/i });
    fireEvent.click(editBtn);

    expect(
      await screen.findByRole("button", { name: /upload avatar/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        container.querySelector("[data-slot='card-header'] [data-slot='avatar']"),
      ).toBeNull();
    });
  });
});
