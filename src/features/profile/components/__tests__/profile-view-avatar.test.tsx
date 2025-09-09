import { fireEvent, screen } from "@testing-library/react";
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
  it.skip("shows avatar in header in view mode and shows upload UI only in edit mode", async () => {
    const rq = await import("@tanstack/react-query");
    const defaultReturn = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      error: null,
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (rq as any).useQuery.mockImplementation((options: any) => {
      if (options?.queryKey?.[0] === "userProfile") {
        return {
          data: {
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
          },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          error: null,
        };
      }
      return defaultReturn;
    });

    const { ProfileView } = await import("../profile-view");
    const { container } = await renderWithRouter(<ProfileView />, {
      path: "/test",
      initialEntries: ["/test"],
      includeQueryClient: true,
    });

    // Header should be present immediately from seeded cache

    // View mode: header avatar (in card header) is present, upload UI absent
    const headerAvatar = container.querySelector(
      "[data-slot='card-header'] [data-slot='avatar']",
    );
    expect(headerAvatar).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /upload avatar/i }),
    ).not.toBeInTheDocument();

    // Enter edit mode
    const editBtn = screen.getByRole("button", { name: /Edit Basic Information/i });
    fireEvent.click(editBtn);

    // Upload UI appears; header avatar hidden
    expect(
      await screen.findByRole("button", { name: /upload avatar/i }),
    ).toBeInTheDocument();
    const headerAvatarAfter = container.querySelector(".h-10.w-10[data-slot='avatar']");
    expect(headerAvatarAfter).toBeFalsy();
  });
});
