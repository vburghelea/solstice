import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { listCampaignsWithCount } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { listGamesWithCount } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { GameMasterFeedbackTriageBoard } from "~/features/gm/components/game-master-feedback-triage";
import type { OperationResult } from "~/shared/types/common";

const PAGE_SIZE = 12;

interface LoaderData {
  completedSessionsResult: GamesWithCountResult;
  upcomingSessionsResult: GamesWithCountResult;
  activeCampaignsResult: CampaignsWithCountResult;
}

type GamesWithCountResult = OperationResult<{
  items: GameListItem[];
  totalCount: number;
}>;
type CampaignsWithCountResult = OperationResult<{
  items: CampaignListItem[];
  totalCount: number;
}>;

export const Route = createFileRoute("/gm/feedback")({
  loader: async () => {
    const [completedSessionsResult, upcomingSessionsResult, activeCampaignsResult] =
      await Promise.all([
        listGamesWithCount({
          data: {
            filters: { status: "completed" },
            page: 1,
            pageSize: PAGE_SIZE,
          },
        }),
        listGamesWithCount({
          data: {
            filters: { status: "scheduled" },
            page: 1,
            pageSize: PAGE_SIZE,
          },
        }),
        listCampaignsWithCount({
          data: {
            filters: { status: "active" },
            page: 1,
            pageSize: PAGE_SIZE,
          },
        }),
      ]);

    return {
      completedSessionsResult,
      upcomingSessionsResult,
      activeCampaignsResult,
    } satisfies LoaderData;
  },
  component: GameMasterFeedbackRoute,
});

function GameMasterFeedbackRoute() {
  const { completedSessionsResult, upcomingSessionsResult, activeCampaignsResult } =
    Route.useLoaderData() as LoaderData;

  const completedSessionsQuery = useSuspenseQuery<GamesWithCountResult>({
    queryKey: ["gm", "feedback", "sessions", "completed"],
    queryFn: async () =>
      listGamesWithCount({
        data: {
          filters: { status: "completed" },
          page: 1,
          pageSize: PAGE_SIZE,
        },
      }),
    initialData: completedSessionsResult,
  });

  const upcomingSessionsQuery = useSuspenseQuery<GamesWithCountResult>({
    queryKey: ["gm", "feedback", "sessions", "upcoming"],
    queryFn: async () =>
      listGamesWithCount({
        data: {
          filters: { status: "scheduled" },
          page: 1,
          pageSize: PAGE_SIZE,
        },
      }),
    initialData: upcomingSessionsResult,
  });

  const activeCampaignsQuery = useSuspenseQuery<CampaignsWithCountResult>({
    queryKey: ["gm", "feedback", "campaigns"],
    queryFn: async () =>
      listCampaignsWithCount({
        data: {
          filters: { status: "active" },
          page: 1,
          pageSize: PAGE_SIZE,
        },
      }),
    initialData: activeCampaignsResult,
  });

  const hasError =
    !completedSessionsQuery.data.success ||
    !upcomingSessionsQuery.data.success ||
    !activeCampaignsQuery.data.success;

  const completedSessions = completedSessionsQuery.data.success
    ? completedSessionsQuery.data.data.items
    : [];
  const upcomingSessions = upcomingSessionsQuery.data.success
    ? upcomingSessionsQuery.data.data.items
    : [];
  const activeCampaigns = activeCampaignsQuery.data.success
    ? activeCampaignsQuery.data.data.items
    : [];

  return (
    <div className="space-y-6">
      {hasError ? (
        <Alert variant="destructive">
          <AlertTitle>We couldn’t load every queue</AlertTitle>
          <AlertDescription>
            Some campaign or session data failed to fetch. Refresh to retry or open the
            legacy dashboards for fallback workflows.
          </AlertDescription>
        </Alert>
      ) : null}

      <GameMasterFeedbackTriageBoard
        completedSessions={completedSessions}
        upcomingSessions={upcomingSessions}
        activeCampaigns={activeCampaigns}
      />
    </div>
  );
}
