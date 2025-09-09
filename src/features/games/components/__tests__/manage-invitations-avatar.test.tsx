import { screen } from "@testing-library/react";
import type { user as userTable } from "~/db/schema/auth.schema";
import { renderWithRouter } from "~/tests/utils/router";
import { ManageInvitations } from "../ManageInvitations";

describe("ManageInvitations avatars (games)", () => {
  it("renders avatars for invited users", async () => {
    const invited = {
      id: "u1",
      name: "Invited One",
      email: "inv1@example.com",
      uploadedAvatarPath: "/api/avatars/u1.webp",
      image: null,
    } as unknown as typeof userTable.$inferSelect;

    await renderWithRouter(
      <ManageInvitations
        gameId="g1"
        invitations={[
          {
            id: "i1",
            userId: "u1",
            gameId: "g1",
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
    const img = screen.getByRole("img", { name: /invited one/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u1.webp");
  });
});
