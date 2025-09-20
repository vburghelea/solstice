import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingTeamInvite } from "~/features/teams/teams.queries";
import { TeamInvitationsSection } from "../team-invitations";

const acceptTeamInviteMock = vi.fn();
const declineTeamInviteMock = vi.fn();

vi.mock("~/features/teams/teams.mutations", () => ({
  acceptTeamInvite: (input: unknown) => acceptTeamInviteMock(input),
  declineTeamInvite: (input: unknown) => declineTeamInviteMock(input),
}));

describe("TeamInvitationsSection", () => {
  beforeEach(() => {
    acceptTeamInviteMock.mockResolvedValue({});
    declineTeamInviteMock.mockResolvedValue({});
    acceptTeamInviteMock.mockClear();
    declineTeamInviteMock.mockClear();
  });

  const baseInvite: PendingTeamInvite = {
    membership: {
      id: "invite-1",
      teamId: "team-1",
      role: "player",
      invitedAt: new Date("2025-01-01T00:00:00Z"),
      requestedAt: null,
      invitedBy: "captain-1",
    },
    team: {
      id: "team-1",
      name: "Test Thunder",
      slug: "test-thunder",
    },
    inviter: {
      id: "captain-1",
      name: "Captain Casey",
      email: "captain@example.com",
    },
  };

  function renderComponent(invites: PendingTeamInvite[]) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TeamInvitationsSection invites={invites} />
      </QueryClientProvider>,
    );
  }

  it("renders nothing when there are no invites", () => {
    const { container } = renderComponent([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("allows accepting an invitation", async () => {
    renderComponent([baseInvite]);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(acceptTeamInviteMock).toHaveBeenCalledWith({ data: { teamId: "team-1" } });
    });

    expect(await screen.findByText(/Invitation accepted/i)).toBeInTheDocument();
  });

  it("allows declining an invitation", async () => {
    renderComponent([baseInvite]);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /decline/i }));

    await waitFor(() => {
      expect(declineTeamInviteMock).toHaveBeenCalledWith({ data: { teamId: "team-1" } });
    });

    expect(await screen.findByText(/Invitation declined/i)).toBeInTheDocument();
  });
});
