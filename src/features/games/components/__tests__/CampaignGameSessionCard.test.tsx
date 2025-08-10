import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { GameListItem } from "~/features/games/games.types";
import {
  MOCK_CAMPAIGN_GAME_1,
  MOCK_CAMPAIGN_GAME_2,
  MOCK_CAMPAIGN_GAME_3,
} from "~/tests/mocks/games";
import { renderWithRouter, screen } from "~/tests/utils/router";
import { CampaignGameSessionCard } from "../CampaignGameSessionCard";

describe("CampaignGameSessionCard", () => {
  it("renders game session details", async () => {
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_1 as GameListItem}
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    expect(screen.getByText(MOCK_CAMPAIGN_GAME_1.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CAMPAIGN_GAME_1.description)).toBeInTheDocument();
  });

  it("shows owner actions when isOwner is true and game is actionable", async () => {
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_1 as GameListItem}
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    expect(screen.getByRole("button", { name: /Mark Completed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel Session/i })).toBeInTheDocument();
  });

  it("hides owner actions when isOwner is false", async () => {
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_1 as GameListItem}
        isOwner={false}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    expect(
      screen.queryByRole("button", { name: /Mark Completed/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cancel Session/i }),
    ).not.toBeInTheDocument();
  });

  it("hides owner actions for completed games", async () => {
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_2 as GameListItem} // completed game
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    expect(
      screen.queryByRole("button", { name: /Mark Completed/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cancel Session/i }),
    ).not.toBeInTheDocument();
  });

  it("hides owner actions for canceled games", async () => {
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_3 as GameListItem} // canceled game
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    expect(
      screen.queryByRole("button", { name: /Mark Completed/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cancel Session/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onUpdateStatus with "completed" when Mark Completed is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_1 as GameListItem}
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    await user.click(screen.getByRole("button", { name: /Mark Completed/i }));

    expect(onUpdateStatus).toHaveBeenCalledWith({
      data: { gameId: MOCK_CAMPAIGN_GAME_1.id, status: "completed" },
    });
  });

  it('calls onUpdateStatus with "canceled" when Cancel Session is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    await renderWithRouter(
      <CampaignGameSessionCard
        game={MOCK_CAMPAIGN_GAME_1 as GameListItem}
        isOwner={true}
        onUpdateStatus={onUpdateStatus}
      />,
      {
        path: "/dashboard/games",
        initialEntries: ["/dashboard/games"],
      },
    );

    await user.click(screen.getByRole("button", { name: /Cancel Session/i }));

    expect(onUpdateStatus).toHaveBeenCalledWith({
      data: { gameId: MOCK_CAMPAIGN_GAME_1.id, status: "canceled" },
    });
  });
});
