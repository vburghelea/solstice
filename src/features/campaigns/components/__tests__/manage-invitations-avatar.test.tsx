import { screen } from "@testing-library/react";
import type { user as userTable } from "~/db/schema/auth.schema";
import { renderWithRouter } from "~/tests/utils/router";
import { ManageInvitations } from "../ManageInvitations";

describe("ManageInvitations avatars (campaigns)", () => {
  it("renders avatars for invited users", async () => {
    const invited = {
      id: "u1",
      name: "Invited Camp",
      email: "inv1@example.com",
      uploadedAvatarPath: "/api/avatars/u1.webp",
      image: null,
    } as unknown as typeof userTable.$inferSelect;

    await renderWithRouter(
      <ManageInvitations
        campaignId="c1"
        invitations={[
          {
            id: "i1",
            userId: "u1",
            campaignId: "c1",
            role: "invited",
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: invited,
          },
        ]}
      />,
      { path: "/test", initialEntries: ["/test"], includeQueryClient: true },
    );
    const img = screen.getByRole("img", { name: /invited camp/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u1.webp");
  });
});
