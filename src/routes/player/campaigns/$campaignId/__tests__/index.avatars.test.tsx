import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { user as userTable } from "~/db/schema/auth.schema";
import type {
  CampaignApplication,
  CampaignParticipant,
} from "~/features/campaigns/campaigns.types";
import { CampaignParticipantsList } from "~/features/campaigns/components/CampaignParticipantsList";
import { ManageInvitations } from "~/features/campaigns/components/ManageInvitations";

vi.mock("~/features/campaigns/campaigns.mutations", () => ({
  removeCampaignParticipant: vi.fn(async () => ({ success: true })),
  updateCampaignParticipant: vi.fn(async () => ({ success: true })),
  removeCampaignParticipantBan: vi.fn(async () => ({ success: true })),
  respondToCampaignApplication: vi.fn(async () => ({ success: true })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Campaign avatar components", () => {
  it("shows avatars for invited users in ManageInvitations", async () => {
    const invitedUser = {
      id: "u2",
      name: "Invited Camp",
      email: "inv@example.com",
      uploadedAvatarPath: "/api/avatars/u2.webp",
      image: null,
    } as unknown as typeof userTable.$inferSelect;

    const invitations: CampaignParticipant[] = [
      {
        id: "p2",
        userId: "u2",
        campaignId: "c1",
        role: "invited",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: invitedUser,
      },
    ];

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ManageInvitations campaignId="c1" invitations={invitations} />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /invited camp/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");

    queryClient.clear();
  });

  it("shows participant avatars prioritizing uploaded path", async () => {
    const participantUser = {
      id: "u3",
      name: "Camp Player",
      email: "player@example.com",
      uploadedAvatarPath: "/api/avatars/u3.webp",
      image: "https://provider/avatar-u3.png",
    } as unknown as typeof userTable.$inferSelect;

    const participants: CampaignParticipant[] = [
      {
        id: "p3",
        userId: "u3",
        campaignId: "c1",
        role: "player",
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: participantUser,
      },
    ];

    const applications: CampaignApplication[] = [];

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CampaignParticipantsList
          campaignId="c1"
          isOwner={true}
          currentUser={null}
          campaignOwnerId="owner"
          applications={applications}
          participants={participants}
        />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /camp player/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u3.webp");

    queryClient.clear();
  });
});
