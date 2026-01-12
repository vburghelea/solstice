import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getTeam, getTeamMembers } from "~/features/teams/teams.queries";
import { createPageHead } from "~/shared/lib/page-head";

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
  head: () => createPageHead("Team Details"),
  component: TeamLayout,
});

function TeamLayout() {
  return <Outlet />;
}
