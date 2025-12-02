import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { MemberDashboard, PublicPortalPage } from "~/features/dashboard";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import type { MembershipStatus } from "~/features/membership/membership.types";
import { getProfileCompletionStatus } from "~/features/profile/profile.queries";
import { getPendingTeamInvites, getUserTeams } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Check if user is authenticated
    const user = await getCurrentUser();

    if (!user) {
      // Unauthenticated - show public portal page
      return { view: "public" as const };
    }

    // Authenticated - load all dashboard data in parallel
    const [membershipResult, profileStatus, userTeams, pendingInvites, upcomingEvents] =
      await Promise.all([
        getUserMembershipStatus(),
        getProfileCompletionStatus(),
        getUserTeams({ data: {} }),
        getPendingTeamInvites(),
        getUpcomingEvents({ data: { limit: 5 } }),
      ]);

    // Extract membership data from result
    const membershipStatus: MembershipStatus | null = membershipResult.success
      ? (membershipResult.data ?? null)
      : null;

    return {
      view: "dashboard" as const,
      user,
      membershipStatus,
      profileStatus,
      userTeams,
      pendingInvites,
      upcomingEvents: upcomingEvents as EventWithDetails[],
    };
  },
  component: HomePage,
});

type LoaderData =
  | { view: "public" }
  | {
      view: "dashboard";
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      membershipStatus: MembershipStatus | null;
      profileStatus: Awaited<ReturnType<typeof getProfileCompletionStatus>>;
      userTeams: Awaited<ReturnType<typeof getUserTeams>>;
      pendingInvites: Awaited<ReturnType<typeof getPendingTeamInvites>>;
      upcomingEvents: EventWithDetails[];
    };

function HomePage() {
  const data = Route.useLoaderData() as LoaderData;

  if (data.view === "public") {
    return <PublicPortalPage />;
  }

  return (
    <MemberDashboard
      user={data.user}
      membershipStatus={data.membershipStatus}
      profileStatus={data.profileStatus}
      userTeams={data.userTeams}
      pendingInvites={data.pendingInvites}
      upcomingEvents={data.upcomingEvents}
    />
  );
}
