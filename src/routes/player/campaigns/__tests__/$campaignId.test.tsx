import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import {
  MOCK_CAMPAIGN,
  mockApplyToCampaign,
  mockUpdateCampaign,
} from "~/tests/mocks/campaigns";
import {
  MOCK_CAMPAIGN_GAME_1,
  MOCK_CAMPAIGN_GAME_2,
  MOCK_CAMPAIGN_GAME_3,
} from "~/tests/mocks/games";
import {
  mockUseQueryCampaign,
  mockUseQueryCampaignGameSessions,
  mockUseQueryRelationship,
  mockUseQueryUserCampaignApplication,
} from "~/tests/mocks/react-query";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { spyUseMutationRun } from "~/tests/utils/react-query";
import { renderWithRouter } from "~/tests/utils/router";
import { Route as CampaignRoute } from "../$campaignId/index";

const CampaignDetailsPage = CampaignRoute.options.component!;

describe("Campaign Details Page", () => {
  const setupRouteSpies = ({
    user = MOCK_OWNER_USER,
    status,
  }: {
    user?: typeof MOCK_OWNER_USER | null;
    status?: string;
  }) => {
    vi.spyOn(CampaignRoute, "useParams").mockReturnValue({
      campaignId: MOCK_CAMPAIGN.id,
    } as ReturnType<typeof CampaignRoute.useParams>);
    vi.spyOn(CampaignRoute, "useRouteContext").mockReturnValue({
      user,
    } as unknown as ReturnType<typeof CampaignRoute.useRouteContext>);
    vi.spyOn(CampaignRoute, "useSearch").mockReturnValue(
      (status ? { status } : {}) as ReturnType<typeof CampaignRoute.useSearch>,
    );
    const navigateMock = vi.fn();
    vi.spyOn(CampaignRoute, "useNavigate").mockReturnValue(
      navigateMock as unknown as ReturnType<typeof CampaignRoute.useNavigate>,
    );
    return { navigateMock };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Ensure mutations invoke provided mutationFn so our mocks run
  beforeEach(() => {
    spyUseMutationRun();
  });

  it("renders the campaign details page", async () => {
    setupRouteSpies({});

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(screen.getByText(MOCK_CAMPAIGN.name)).toBeInTheDocument();
      expect(screen.getByText("Game sessions")).toBeInTheDocument();
      // Session cards can duplicate names across mobile/desktop layouts; assert at least once
      expect(screen.getAllByText(MOCK_CAMPAIGN_GAME_1.name).length).toBeGreaterThan(0);
      expect(screen.getAllByText(MOCK_CAMPAIGN_GAME_2.name).length).toBeGreaterThan(0);
      expect(screen.getAllByText(MOCK_CAMPAIGN_GAME_3.name).length).toBeGreaterThan(0);
    });
  });

  it("updates search when filtering game sessions", async () => {
    const user = userEvent.setup();
    const { navigateMock } = setupRouteSpies({});

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    // Radix Select trigger renders as a combobox without accessible name
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /Completed/i }));

    expect(navigateMock).toHaveBeenCalledWith({
      search: { status: "completed" },
    });
  });

  it("renders only completed sessions when status search is 'completed'", async () => {
    // Override the campaign game sessions query to return only completed
    mockUseQueryCampaignGameSessions.mockReturnValue({
      data: { success: true, data: [MOCK_CAMPAIGN_GAME_2] },
      isLoading: false,
      error: null,
    });

    setupRouteSpies({ status: "completed" });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}?status=completed`],
    });

    // Since sample games share the same name, assert list size via action links
    const viewLinks = screen.getAllByRole("link", { name: "View Game" });
    expect(viewLinks).toHaveLength(1);
  });

  it("renders Create session link with campaignId for owner", async () => {
    setupRouteSpies({});

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const link = await screen.findByRole("link", { name: "Create session" });
    expect(link).toHaveAttribute(
      "href",
      `/player/games/create?campaignId=${MOCK_CAMPAIGN.id}`,
    );
  });

  it("renders owner-only sections (Invite Participants, Manage Invitations)", async () => {
    setupRouteSpies({});
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    // Card titles are not semantic headings; assert by text
    expect(await screen.findByText("Invite Participants")).toBeInTheDocument();
    expect(await screen.findByText("Manage Invitations")).toBeInTheDocument();
  });

  it("hides owner-only sections for non-owner", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "non-owner" } });
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(screen.queryByText("Invite Participants")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Invitations")).not.toBeInTheDocument();
  });

  it("shows Apply button for eligible non-owner and calls apply mutation", async () => {
    // Non-owner context; campaign is public and active by default in mocks
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const applyButtons = await screen.findAllByRole("button", { name: "Apply to join" });
    expect(applyButtons.length).toBeGreaterThan(0);

    await userEvent.click(applyButtons[0]);

    expect(mockApplyToCampaign).toHaveBeenCalledWith({
      data: { campaignId: MOCK_CAMPAIGN.id },
    });
  });

  it("owner can open edit form, submit, and exit edit mode on success", async () => {
    setupRouteSpies({});
    // Ensure update mutation resolves successfully
    mockUpdateCampaign.mockResolvedValueOnce({ success: true, data: MOCK_CAMPAIGN });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    // Enter edit mode by clicking the edit button (uses aria-label)
    const editBtn = screen.getByRole("button", {
      name: "Edit campaign details",
    });
    await userEvent.click(editBtn);

    // Update form should appear - look for the submit button with correct translation
    const updateBtn = await screen.findByRole("button", { name: "Update Campaign" });
    await userEvent.click(updateBtn);

    expect(mockUpdateCampaign).toHaveBeenCalled();

    // After success, edit mode should close; original Edit button visible again
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Update Campaign" }),
      ).not.toBeInTheDocument();
    });
  });

  // Negative gating scenarios: Apply button should be hidden
  it("hides Apply when campaign is protected and user is not a connection", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });
    mockUseQueryCampaign.mockReturnValue({
      data: { ...MOCK_CAMPAIGN, visibility: "protected" },
      isLoading: false,
      error: null,
    });
    mockUseQueryRelationship.mockReturnValue({
      data: {
        success: true,
        data: { blocked: false, blockedBy: false, isConnection: false },
      },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(screen.queryAllByRole("button", { name: "Apply to join" })).toHaveLength(0);
  });

  it("hides Apply and shows block banner when user is blocked or blocking", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });
    mockUseQueryRelationship.mockReturnValue({
      data: {
        success: true,
        data: { blocked: true, blockedBy: false, isConnection: false },
      },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(screen.queryAllByRole("button", { name: "Apply to join" })).toHaveLength(0);
    expect(
      screen.getByText(
        /You cannot interact with this organizer due to block settings\./i,
      ),
    ).toBeInTheDocument();
  });

  it("hides Apply when campaign is not active", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });
    mockUseQueryCampaign.mockReturnValue({
      data: { ...MOCK_CAMPAIGN, status: "inactive" },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(screen.queryAllByRole("button", { name: "Apply to join" })).toHaveLength(0);
  });

  it("hides Apply when user has a pending application", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });
    mockUseQueryUserCampaignApplication.mockReturnValue({
      data: { status: "pending" },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(screen.queryAllByRole("button", { name: "Apply to join" })).toHaveLength(0);
  });

  it("hides Apply when user has a rejected participant status", async () => {
    const nonOwner = { ...MOCK_OWNER_USER, id: "not-owner" };
    setupRouteSpies({ user: nonOwner });
    mockUseQueryCampaign.mockReturnValue({
      data: {
        ...MOCK_CAMPAIGN,
        participants: [
          { id: "p1", userId: nonOwner.id, role: "player", status: "rejected" },
        ],
      },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(screen.queryAllByRole("button", { name: "Apply to join" })).toHaveLength(0);
  });

  // Error path for update flow
  it("shows error toast and stays in edit mode when update fails", async () => {
    setupRouteSpies({});
    mockUseQueryCampaign.mockReturnValue({
      data: MOCK_CAMPAIGN,
      isLoading: false,
      error: null,
    });
    mockUpdateCampaign.mockResolvedValueOnce({
      success: false,
      errors: [{ code: "SERVER_ERROR", message: "Update failed" }],
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/player/campaigns/$campaignId",
      initialEntries: [`/player/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const editBtn = screen.getByRole("button", {
      name: "Edit campaign details",
    });
    await userEvent.click(editBtn);

    const updateBtn = await screen.findByRole("button", { name: "Update Campaign" });
    await userEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalled();
    // Still in edit mode
    expect(screen.getByRole("button", { name: "Update Campaign" })).toBeInTheDocument();
  });
});
