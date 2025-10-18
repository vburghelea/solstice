import { useSuspenseQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { listCampaignsWithCount } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { listGamesWithCount } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { GameMasterDashboard } from "~/features/gm/components/game-master-dashboard";
import { listGmB2bPipeline } from "~/features/gm/gm.queries";
import type { GmPipelineSnapshot } from "~/features/gm/gm.types";
import { useGmTranslation } from "~/hooks/useTypedTranslation";
import type { OperationResult } from "~/shared/types/common";

const UPCOMING_SESSION_PAGE_SIZE = 6;
const ACTIVE_CAMPAIGN_PAGE_SIZE = 6;

export interface GameMasterDashboardInitialData {
  readonly scheduledGamesResult: GamesQueryResult;
  readonly activeCampaignsResult: CampaignsQueryResult;
  readonly pipelineResult: PipelineQueryResult;
}

type GamesQueryResult = OperationResult<{ items: GameListItem[]; totalCount: number }>;
type CampaignsQueryResult = OperationResult<{
  items: CampaignListItem[];
  totalCount: number;
}>;
type PipelineQueryResult = OperationResult<GmPipelineSnapshot>;

export async function loadGameMasterDashboardData(): Promise<GameMasterDashboardInitialData> {
  const [scheduledGamesResult, activeCampaignsResult, pipelineResult] = await Promise.all(
    [
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
    ],
  );

  return {
    scheduledGamesResult,
    activeCampaignsResult,
    pipelineResult,
  } satisfies GameMasterDashboardInitialData;
}

export function GameMasterDashboardContainer({
  initialData,
}: {
  readonly initialData?: GameMasterDashboardInitialData;
}) {
  const { t } = useGmTranslation();
  const scheduledGamesInitialData = initialData?.scheduledGamesResult;
  const campaignsInitialData = initialData?.activeCampaignsResult;
  const pipelineInitialData = initialData?.pipelineResult;

  const scheduledGamesQuery = useSuspenseQuery<
    GamesQueryResult,
    Error,
    GamesQueryResult,
    ["gm", "dashboard", "scheduledGames"]
  >({
    queryKey: ["gm", "dashboard", "scheduledGames"] as const,
    queryFn: async () =>
      listGamesWithCount({
        data: {
          filters: { status: "scheduled" },
          page: 1,
          pageSize: UPCOMING_SESSION_PAGE_SIZE,
        },
      }),
    ...(scheduledGamesInitialData ? { initialData: scheduledGamesInitialData } : {}),
  });

  const campaignsQuery = useSuspenseQuery<
    CampaignsQueryResult,
    Error,
    CampaignsQueryResult,
    ["gm", "dashboard", "campaigns"]
  >({
    queryKey: ["gm", "dashboard", "campaigns"] as const,
    queryFn: async () =>
      listCampaignsWithCount({
        data: {
          filters: { status: "active" },
          page: 1,
          pageSize: ACTIVE_CAMPAIGN_PAGE_SIZE,
        },
      }),
    ...(campaignsInitialData ? { initialData: campaignsInitialData } : {}),
  });

  const pipelineQuery = useSuspenseQuery<
    PipelineQueryResult,
    Error,
    PipelineQueryResult,
    ["gm", "dashboard", "pipeline"]
  >({
    queryKey: ["gm", "dashboard", "pipeline"] as const,
    queryFn: async () => listGmB2bPipeline(),
    ...(pipelineInitialData ? { initialData: pipelineInitialData } : {}),
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
          <AlertTitle>{t("dashboard.loading_error.title")}</AlertTitle>
          <AlertDescription>{t("dashboard.loading_error.description")}</AlertDescription>
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
