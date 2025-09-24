import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  mockUseQueryCampaign,
  mockUseQueryCampaignGameSessions,
  mockUseQueryRelationship,
} from "~/tests/mocks/react-query";

function setupRoute(mod: unknown, currentUserId: string, campaignId = "c1") {
  const m = mod as { Route: unknown };
  (m.Route as unknown as { useParams: () => { campaignId: string } }).useParams = () => ({
    campaignId,
  });
  (
    m.Route as unknown as { useRouteContext: () => { user: { id: string } | null } }
  ).useRouteContext = () => ({
    user: { id: currentUserId },
  });
  // Stub Router-dependent hooks
  (m.Route as unknown as { useSearch: () => { status?: string } }).useSearch = () => ({
    status: "",
  });
  (m.Route as unknown as { useNavigate: () => (args: unknown) => void }).useNavigate =
    () => () => {};
}

function qc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("CampaignDetailsPage apply eligibility (connections-only)", () => {
  it("hides Apply when protected and not a connection", async () => {
    // Avoid rendering session list cards that contain <Link>
    mockUseQueryCampaignGameSessions.mockReturnValueOnce({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
    });
    mockUseQueryCampaign.mockReturnValueOnce({
      data: {
        id: "c1",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        name: "Protected Campaign",
        description: "A test campaign",
        recurrence: "weekly",
        timeOfDay: "evening",
        sessionDuration: "3h",
        pricePerSession: 0,
        language: "en",
        location: { address: "Test Location" },
        status: "active",
        minimumRequirements: null,
        safetyRules: null,
        sessionZeroData: null,
        campaignExpectations: null,
        tableExpectations: null,
        characterCreationOutcome: null,
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      isLoading: false,
      error: null,
    });
    mockUseQueryRelationship.mockReturnValueOnce({
      data: {
        success: true,
        data: { blocked: false, blockedBy: false, isConnection: false },
      },
      isLoading: false,
      error: null,
    });

    const mod = await import("../index");
    setupRoute(mod, "viewer");

    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={qc()}>
        <Component />
      </QueryClientProvider>,
    );

    await screen.findByText(/protected campaign/i);
    const btn = screen.queryByRole("button", { name: /apply to campaign/i });
    expect(btn).toBeNull();
  });

  it("shows Apply when protected and viewer is a connection", async () => {
    // Avoid rendering session list cards that contain <Link>
    mockUseQueryCampaignGameSessions.mockReturnValueOnce({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
    });
    mockUseQueryCampaign.mockReturnValueOnce({
      data: {
        id: "c2",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        name: "Connected Campaign",
        description: "A test campaign",
        recurrence: "weekly",
        timeOfDay: "evening",
        sessionDuration: "3h",
        pricePerSession: 0,
        language: "en",
        location: { address: "Test Location" },
        status: "active",
        minimumRequirements: null,
        safetyRules: null,
        sessionZeroData: null,
        campaignExpectations: null,
        tableExpectations: null,
        characterCreationOutcome: null,
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      isLoading: false,
      error: null,
    });
    mockUseQueryRelationship.mockReturnValueOnce({
      data: {
        success: true,
        data: { blocked: false, blockedBy: false, isConnection: true },
      },
      isLoading: false,
      error: null,
    });

    const mod = await import("../index");
    setupRoute(mod, "viewer", "c2");

    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={qc()}>
        <Component />
      </QueryClientProvider>,
    );

    await screen.findByText(/connected campaign/i);
    const btn = await screen.findByRole("button", { name: /apply to campaign/i });
    expect(btn).toBeInTheDocument();
  });
});
