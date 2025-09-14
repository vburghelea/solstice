import { screen } from "@testing-library/react";
import type { user as userTable } from "~/db/schema/auth.schema";
import type { User as AuthUser } from "~/lib/auth/types";
import { renderWithRouter } from "~/tests/utils/router";
import { GameParticipantsList } from "../GameParticipantsList";

describe("GameParticipantsList avatars", () => {
  it("renders avatars for participants from uploaded path first", async () => {
    const owner = { id: "owner", email: "o@x", name: "Owner" } as unknown as AuthUser;
    const pUser = {
      id: "u1",
      name: "P1",
      email: "p1@example.com",
      image: "https://provider/p1.png",
      uploadedAvatarPath: "/api/avatars/u1.webp",
    } as unknown as typeof userTable.$inferSelect;

    await renderWithRouter(
      <GameParticipantsList
        gameId="g1"
        isOwner={true}
        currentUser={owner}
        gameOwnerId="owner"
        applications={[]}
        participants={[
          {
            id: "p1",
            userId: "u1",
            gameId: "g1",
            role: "player",
            status: "approved",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: pUser,
          },
        ]}
      />,
      { path: "/test", initialEntries: ["/test"], includeQueryClient: true },
    );
    const img = screen.getByRole("img", { name: /p1/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u1.webp");
  });
});
