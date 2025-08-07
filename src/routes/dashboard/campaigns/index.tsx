import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Gamepad2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "~/components/ui/card";
import { listCampaigns } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { CampaignCard } from "~/features/campaigns/components/CampaignCard";

export const Route = createFileRoute("/dashboard/campaigns/")({
  component: CampaignsPage,
  loader: async () => {
    const result = await listCampaigns({ data: {} });
    if (!result.success) {
      toast.error("Failed to load campaigns.");
      return { campaigns: [] };
    }
    return { campaigns: result.data };
  },
});

function CampaignsPage() {
  const { campaigns: initialCampaigns } = Route.useLoaderData();

  const { data: campaignsData } = useSuspenseQuery({
    queryKey: ["allVisibleCampaigns"],
    queryFn: () => listCampaigns({ data: {} }),
    initialData: { success: true, data: initialCampaigns },
  });

  const campaigns = campaignsData.success ? campaignsData.data : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground">Manage your campaign sessions</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/campaigns/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gamepad2 className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first campaign to get started
            </p>
            <Button asChild>
              <Link to="/dashboard/campaigns/create">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create New Campaign
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: CampaignListItem) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
