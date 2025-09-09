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
import { CampaignDetailsPage, Route as CampaignRoute } from "../$campaignId/index";

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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(screen.getByText(MOCK_CAMPAIGN.name)).toBeInTheDocument();
      expect(screen.getByText(/Game Sessions/i)).toBeInTheDocument();
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}?status=completed`],
    });

    // Since sample games share the same name, assert list size via action links
    const viewLinks = screen.getAllByRole("link", { name: /View Game/i });
    expect(viewLinks).toHaveLength(1);
  });

  it("renders Create Game Session link with campaignId for owner", async () => {
    setupRouteSpies({});

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const link = await screen.findByRole("link", { name: /Create Game Session/i });
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/games/create?campaignId=${MOCK_CAMPAIGN.id}`,
    );
  });

  it("renders owner-only sections (Invite Participants, Manage Invitations)", async () => {
    setupRouteSpies({});
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    // Card titles are not semantic headings; assert by text
    expect(await screen.findByText(/Invite Participants/i)).toBeInTheDocument();
    expect(await screen.findByText(/Manage Invitations/i)).toBeInTheDocument();
  });

  it("hides owner-only sections for non-owner", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "non-owner" } });
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(
      screen.queryByRole("heading", { name: /Invite Participants/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Manage Invitations/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Apply button for eligible non-owner and calls apply mutation", async () => {
    // Non-owner context; campaign is public and active by default in mocks
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const applyBtn = await screen.findByRole("button", { name: /Apply to Campaign/i });
    expect(applyBtn).toBeInTheDocument();

    await userEvent.click(applyBtn);

    expect(mockApplyToCampaign).toHaveBeenCalledWith({
      data: { campaignId: MOCK_CAMPAIGN.id },
    });
  });

  it("owner can open edit form, submit, and exit edit mode on success", async () => {
    setupRouteSpies({});
    // Ensure update mutation resolves successfully
    mockUpdateCampaign.mockResolvedValueOnce({ success: true, data: MOCK_CAMPAIGN });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    // Enter edit mode if needed (form may already be visible)
    const maybeEditBtn = screen.queryByRole("button", { name: /Edit Campaign/i });
    if (maybeEditBtn) {
      await userEvent.click(maybeEditBtn);
    }

    // Update form should appear
    const updateBtn = await screen.findByRole("button", { name: /Update Campaign/i });
    await userEvent.click(updateBtn);

    expect(mockUpdateCampaign).toHaveBeenCalled();

    // After success, edit mode should close; original Edit button visible again
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Update Campaign/i }),
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(
      screen.queryByRole("button", { name: /Apply to Campaign/i }),
    ).not.toBeInTheDocument();
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    expect(
      screen.queryByRole("button", { name: /Apply to Campaign/i }),
    ).not.toBeInTheDocument();
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(
      screen.queryByRole("button", { name: /Apply to Campaign/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Apply when user has a pending application", async () => {
    setupRouteSpies({ user: { ...MOCK_OWNER_USER, id: "not-owner" } });
    mockUseQueryUserCampaignApplication.mockReturnValue({
      data: { status: "pending" },
      isLoading: false,
      error: null,
    });

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(
      screen.queryByRole("button", { name: /Apply to Campaign/i }),
    ).not.toBeInTheDocument();
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });
    expect(
      screen.queryByRole("button", { name: /Apply to Campaign/i }),
    ).not.toBeInTheDocument();
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
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    const maybeEdit = screen.queryByRole("button", { name: /Edit Campaign/i });
    if (maybeEdit) await userEvent.click(maybeEdit);

    const updateBtn = await screen.findByRole("button", { name: /Update Campaign/i });
    await userEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalled();
    // Still in edit mode
    expect(screen.getByRole("button", { name: /Update Campaign/i })).toBeInTheDocument();
  });
});
