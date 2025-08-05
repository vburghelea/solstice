import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getTeam, getTeamMembers } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/dashboard/teams/$teamId")({
  loader: async ({ params }) => {
    const [teamData, members] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getTeamMembers({ data: { teamId: params.teamId } }),
    ]);

    if (!teamData) {
      throw new Error("Team not found");
    }

    return { teamData, members };
  },
  component: TeamLayout,
});

function TeamLayout() {
  return <Outlet />;
}
