import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { getCampaign } from "~/features/campaigns/campaigns.queries";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { listGameSessionsByCampaignId } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { GameMasterCampaignWorkspace } from "~/features/gm/components/game-master-campaign-workspace";
import type { OperationResult } from "~/shared/types/common";

interface LoaderData {
  campaignResult: CampaignQueryResult;
  upcomingSessionsResult: SessionsQueryResult;
  completedSessionsResult: SessionsQueryResult;
}

type CampaignQueryResult = OperationResult<CampaignWithDetails | null>;
type SessionsQueryResult = OperationResult<GameListItem[]>;

export const Route = createFileRoute("/gm/campaigns/$campaignId")({
  loader: async ({ params }) => {
    const [campaignResult, upcomingSessionsResult, completedSessionsResult] =
      await Promise.all([
        getCampaign({ data: { id: params.campaignId } }),
        listGameSessionsByCampaignId({
          data: { campaignId: params.campaignId, status: "scheduled" },
        }),
        listGameSessionsByCampaignId({
          data: { campaignId: params.campaignId, status: "completed" },
        }),
      ]);

    return {
      campaignResult,
      upcomingSessionsResult,
      completedSessionsResult,
    } satisfies LoaderData;
  },
  component: GameMasterCampaignWorkspaceRoute,
});

function GameMasterCampaignWorkspaceRoute() {
  const { campaignId } = Route.useParams();
  const { campaignResult, upcomingSessionsResult, completedSessionsResult } =
    Route.useLoaderData() as LoaderData;

  const campaignQuery = useSuspenseQuery<CampaignQueryResult>({
    queryKey: ["gm", "campaign", campaignId, "workspace"],
    queryFn: async () => getCampaign({ data: { id: campaignId } }),
    initialData: campaignResult,
  });

  const upcomingSessionsQuery = useSuspenseQuery<SessionsQueryResult>({
    queryKey: ["gm", "campaign", campaignId, "sessions", "upcoming"],
    queryFn: async () =>
      listGameSessionsByCampaignId({
        data: { campaignId, status: "scheduled" },
      }),
    initialData: upcomingSessionsResult,
  });

  const completedSessionsQuery = useSuspenseQuery<SessionsQueryResult>({
    queryKey: ["gm", "campaign", campaignId, "sessions", "completed"],
    queryFn: async () =>
      listGameSessionsByCampaignId({
        data: { campaignId, status: "completed" },
      }),
    initialData: completedSessionsResult,
  });

  const hasError =
    !campaignQuery.data.success ||
    !upcomingSessionsQuery.data.success ||
    !completedSessionsQuery.data.success;

  if (!campaignQuery.data.success || !campaignQuery.data.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Campaign workspace unavailable</AlertTitle>
        <AlertDescription>
          We could not load this campaign for Alex’s studio. Return to the dashboard or
          try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const campaign = campaignQuery.data.data;

  const upcomingSessions = upcomingSessionsQuery.data.success
    ? sortSessionsAscending(upcomingSessionsQuery.data.data)
    : [];
  const completedSessions = completedSessionsQuery.data.success
    ? sortSessionsDescending(completedSessionsQuery.data.data)
    : [];

  return (
    <div className="space-y-6">
      {hasError ? (
        <Alert variant="destructive">
          <AlertTitle>Some session data failed to load</AlertTitle>
          <AlertDescription>
            Parts of the session timeline may be missing. Refresh to retry fetching the
            latest schedule.
          </AlertDescription>
        </Alert>
      ) : null}
      <GameMasterCampaignWorkspace
        campaign={campaign}
        upcomingSessions={upcomingSessions}
        completedSessions={completedSessions}
      />
    </div>
  );
}

function sortSessionsAscending(items: GameListItem[]): GameListItem[] {
  return [...items].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  );
}

function sortSessionsDescending(items: GameListItem[]): GameListItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.dateTime).getTime() -
      new Date(a.updatedAt ?? a.dateTime).getTime(),
  );
}
