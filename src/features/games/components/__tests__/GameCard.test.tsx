import { GameListItem } from "~/features/games/games.types";
import { MOCK_GAME } from "~/tests/mocks/games";
import { renderWithRouter, screen } from "~/tests/utils";
import { GameCard } from "../GameCard";

describe("GameCard", () => {
  const mockViewLink = { to: "/games/1" };

  it("renders game information correctly", async () => {
    await renderWithRouter(
      <GameCard game={MOCK_GAME as unknown as GameListItem} viewLink={mockViewLink} />,
      {
        path: "/games",
        initialEntries: ["/games"],
      },
    );

    expect(screen.getByText(MOCK_GAME.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_GAME.description)).toBeInTheDocument();
    expect(screen.getByText("Test System")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("public")).toBeInTheDocument();
    // Check that calendar icon is present for date/time
    const calendarIcon = document.querySelector(".lucide-calendar");
    expect(calendarIcon).toBeInTheDocument();
    // Check that some formatted date is present
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });

  it("displays role badge when user has a role in the game", async () => {
    const gameWithRole = {
      ...MOCK_GAME,
      userRole: {
        role: "owner" as const,
        status: "approved" as const,
      },
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    // Should show the RoleBadge with owner role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("👑")).toBeInTheDocument();
    expect(screen.getByText("Organizer")).toBeInTheDocument();
  });

  it("displays participant role badge when user is an approved participant", async () => {
    const gameWithRole = {
      ...MOCK_GAME,
      userRole: {
        role: "player" as const,
        status: "approved" as const,
      },
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    // Should show the RoleBadge with player role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Participant")).toBeInTheDocument();
  });

  it("displays pending role badge when user has pending status", async () => {
    const gameWithRole = {
      ...MOCK_GAME,
      userRole: {
        role: "player" as const,
        status: "pending" as const,
      },
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    // Should show the RoleBadge with pending status
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("displays invited role badge when user is invited", async () => {
    const gameWithRole = {
      ...MOCK_GAME,
      userRole: {
        role: "invited" as const,
      },
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    // Should show the RoleBadge with invited role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("📧")).toBeInTheDocument();
    expect(screen.getByText("Invitee")).toBeInTheDocument();
  });

  it("does not display RoleBadge when user has no role", async () => {
    const gameWithoutRole = {
      ...MOCK_GAME,
      userRole: null,
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithoutRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    // Should not show any RoleBadge
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("👑")).not.toBeInTheDocument();
    expect(screen.queryByText("🎭")).not.toBeInTheDocument();
    expect(screen.queryByText("📧")).not.toBeInTheDocument();
  });

  it("displays role badge with shrink-0 class to prevent layout issues", async () => {
    const gameWithRole = {
      ...MOCK_GAME,
      userRole: {
        role: "owner" as const,
        status: "approved" as const,
      },
    } as unknown as GameListItem;

    await renderWithRouter(<GameCard game={gameWithRole} viewLink={mockViewLink} />, {
      path: "/games",
      initialEntries: ["/games"],
    });

    const roleBadge = screen.getByRole("status");
    expect(roleBadge).toHaveClass("shrink-0");
  });

  it("displays owner information correctly", async () => {
    await renderWithRouter(
      <GameCard game={MOCK_GAME as unknown as GameListItem} viewLink={mockViewLink} />,
      {
        path: "/games",
        initialEntries: ["/games"],
      },
    );

    // Should show owner information
    expect(screen.getByText("Owner User")).toBeInTheDocument();
    expect(screen.getByText("4.0/5")).toBeInTheDocument();
  });

  it("displays correct date and time formatting", async () => {
    await renderWithRouter(
      <GameCard game={MOCK_GAME as unknown as GameListItem} viewLink={mockViewLink} />,
      {
        path: "/games",
        initialEntries: ["/games"],
      },
    );

    // Should display the formatted date/time with calendar icon
    const calendarIcon = document.querySelector(".lucide-calendar");
    expect(calendarIcon).toBeInTheDocument();
    // Check for formatted date pattern
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("displays view game button", async () => {
    await renderWithRouter(
      <GameCard game={MOCK_GAME as unknown as GameListItem} viewLink={mockViewLink} />,
      {
        path: "/games",
        initialEntries: ["/games"],
      },
    );

    const viewButton = screen.getByRole("link", { name: /view game/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveAttribute("href", "/games/1");
  });
});
