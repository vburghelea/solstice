import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithRouter, screen } from "~/tests/utils/router";

vi.mock("~/features/campaigns/campaigns.queries", () => ({
  listCampaignsWithCount: vi.fn(),
}));

// The i18n mock is already set up in src/tests/mocks/i18n.ts
// This will load the actual locale data from the JSON files

describe("PlayerCampaignsPage pagination", () => {
  it("shows total count and navigates to next page", async () => {
    const { listCampaignsWithCount } = await import(
      "~/features/campaigns/campaigns.queries"
    );
    (listCampaignsWithCount as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            {
              id: "c1",
              name: "C1",
              participantCount: 0,
              visibility: "public",
              gameSystem: { id: 1, name: "Sys" },
            },
            {
              id: "c2",
              name: "C2",
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
              id: "c3",
              name: "C3",
              participantCount: 0,
              visibility: "public",
              gameSystem: { id: 1, name: "Sys" },
            },
          ],
          totalCount: 3,
        },
      });

    const mod = await import("../index");
    const CampaignsPage = mod.Route.options.component!;

    const { MOCK_OWNER_USER } = await import("~/tests/mocks/users");
    await renderWithRouter(<CampaignsPage />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns?status=active&page=1&pageSize=2"],
      user: MOCK_OWNER_USER ?? null,
    });

    expect(await screen.findByText(/Page 1 of 2 • 3 total/i)).toBeInTheDocument();

    const nextBtn = await screen.findByRole("button", { name: /next/i });
    const ue = userEvent.setup();
    await ue.click(nextBtn);

    expect(await screen.findByText(/Page 2 of 2 • 3 total/i)).toBeInTheDocument();
  });
});
