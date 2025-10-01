import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { listCampaignsWithCount } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { listGamesWithCount } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { GameMasterDashboard } from "~/features/gm/components/game-master-dashboard";
import { listGmB2bPipeline } from "~/features/gm/gm.queries";
import type { GmPipelineSnapshot } from "~/features/gm/gm.types";
import type { OperationResult } from "~/shared/types/common";

const UPCOMING_SESSION_PAGE_SIZE = 6;
const ACTIVE_CAMPAIGN_PAGE_SIZE = 6;

interface LoaderData {
  scheduledGamesResult: GamesQueryResult;
  activeCampaignsResult: CampaignsQueryResult;
  pipelineResult: PipelineQueryResult;
}

type GamesQueryResult = OperationResult<{ items: GameListItem[]; totalCount: number }>;
type CampaignsQueryResult = OperationResult<{
  items: CampaignListItem[];
  totalCount: number;
}>;
type PipelineQueryResult = OperationResult<GmPipelineSnapshot>;

export const Route = createFileRoute("/gm/dashboard")({
  loader: async () => {
    const [scheduledGamesResult, activeCampaignsResult, pipelineResult] =
      await Promise.all([
        listGamesWithCount({
          data: {
            filters: { status: "scheduled" },
            page: 1,
            pageSize: UPCOMING_SESSION_PAGE_SIZE,
          },
        }),
        listCampaignsWithCount({
          data: {
            filters: { status: "active" },
            page: 1,
            pageSize: ACTIVE_CAMPAIGN_PAGE_SIZE,
          },
        }),
        listGmB2bPipeline(),
      ]);

    return {
      scheduledGamesResult,
      activeCampaignsResult,
      pipelineResult,
    } satisfies LoaderData;
  },
  component: GameMasterDashboardRoute,
});

function GameMasterDashboardRoute() {
  const { scheduledGamesResult, activeCampaignsResult, pipelineResult } =
    Route.useLoaderData() as LoaderData;

  const scheduledGamesQuery = useSuspenseQuery<GamesQueryResult>({
    queryKey: ["gm", "dashboard", "scheduledGames"],
    queryFn: async () =>
      listGamesWithCount({
        data: {
          filters: { status: "scheduled" },
          page: 1,
          pageSize: UPCOMING_SESSION_PAGE_SIZE,
        },
      }),
    initialData: scheduledGamesResult,
  });

  const campaignsQuery = useSuspenseQuery<CampaignsQueryResult>({
    queryKey: ["gm", "dashboard", "campaigns"],
    queryFn: async () =>
      listCampaignsWithCount({
        data: {
          filters: { status: "active" },
          page: 1,
          pageSize: ACTIVE_CAMPAIGN_PAGE_SIZE,
        },
      }),
    initialData: activeCampaignsResult,
  });

  const scheduledGames = scheduledGamesQuery.data.success
    ? scheduledGamesQuery.data.data.items
    : [];
  const scheduledGamesTotal = scheduledGamesQuery.data.success
    ? scheduledGamesQuery.data.data.totalCount
    : 0;
  const campaigns = campaignsQuery.data.success ? campaignsQuery.data.data.items : [];
  const campaignsTotal = campaignsQuery.data.success
    ? campaignsQuery.data.data.totalCount
    : 0;

  const pipelineQuery = useSuspenseQuery<PipelineQueryResult>({
    queryKey: ["gm", "dashboard", "pipeline"],
    queryFn: async () => listGmB2bPipeline(),
    initialData: pipelineResult,
  });

  const pipelineStages = pipelineQuery.data.success ? pipelineQuery.data.data.stages : [];
  const pipelineOpportunities = pipelineQuery.data.success
    ? pipelineQuery.data.data.opportunities
    : [];

  const hasError =
    !scheduledGamesQuery.data.success ||
    !campaignsQuery.data.success ||
    !pipelineQuery.data.success;

  return (
    <div className="space-y-6">
      {hasError ? (
        <Alert variant="destructive">
          <AlertTitle>We hit a snag loading the studio</AlertTitle>
          <AlertDescription>
            Some campaign or session data could not be fetched. Refresh to retry or open
            the classic dashboard views.
          </AlertDescription>
        </Alert>
      ) : null}
      <GameMasterDashboard
        scheduledGames={scheduledGames}
        scheduledGamesTotal={scheduledGamesTotal}
        campaigns={campaigns}
        campaignsTotal={campaignsTotal}
        pipelineStages={pipelineStages}
        pipelineOpportunities={pipelineOpportunities}
      />
    </div>
  );
}
