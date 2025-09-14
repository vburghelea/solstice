import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter, screen } from "~/tests/utils/router";

vi.mock("~/features/games/games.queries", () => ({
  listGamesWithCount: vi.fn(),
}));

describe("GamesPage pagination", () => {
  it("shows total count and navigates pages", async () => {
    const { listGamesWithCount } = await import("~/features/games/games.queries");
    (listGamesWithCount as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            {
              id: "g1",
              name: "G1",
              participantCount: 0,
              visibility: "public",
              gameSystem: { id: 1, name: "Sys" },
            },
            {
              id: "g2",
              name: "G2",
              participantCount: 0,
              visibility: "public",
              gameSystem: { id: 1, name: "Sys" },
            },
          ],
          totalCount: 3,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            {
              id: "g3",
              name: "G3",
              participantCount: 0,
              visibility: "public",
              gameSystem: { id: 1, name: "Sys" },
            },
          ],
          totalCount: 3,
        },
      });

    const mod = await import("../index");
    await renderWithRouter(<mod.GamesPage />, {
      path: "/dashboard/games",
      initialEntries: ["/dashboard/games?status=scheduled&page=1&pageSize=2"],
    });

    expect(await screen.findByText(/Page 1 of 2 • 3 total/i)).toBeInTheDocument();

    const nextBtn = await screen.findByRole("button", { name: /next/i });
    const user = userEvent.setup();
    await user.click(nextBtn);

    expect(await screen.findByText(/Page 2 of 2 • 3 total/i)).toBeInTheDocument();
  });
});
