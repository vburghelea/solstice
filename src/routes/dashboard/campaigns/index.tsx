import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Gamepad2, PlusIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { campaignStatusEnum } from "~/db/schema";
import { listCampaigns } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { CampaignCard } from "~/features/campaigns/components/CampaignCard";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/dashboard/campaigns/")({
  component: CampaignsPage,
  validateSearch: z.object({
    status: z.enum(campaignStatusEnum.enumValues).optional(),
  }),
  loader: async () => {
    const result = await listCampaigns({
      data: { filters: { status: "active" } },
    });
    if (!result.success) {
      toast.error("Failed to load campaigns.");
      return { campaigns: [] };
    }
    return { campaigns: result.data };
  },
});

export function CampaignsPage() {
  const { status = "active" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: campaignsData } = useSuspenseQuery({
    queryKey: ["allVisibleCampaigns", status],
    queryFn: async () => {
      const result = await listCampaigns({ data: { filters: { status } } });
      if (!result.success) {
        toast.error("Failed to load campaigns.");
        return {
          success: false,
          errors: [{ code: "FETCH_ERROR", message: "Failed to load campaigns" }],
          data: [],
        };
      }
      return result;
    },
  });

  const campaigns = campaignsData.success ? campaignsData.data : [];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Campaigns</h1>
          <p className="text-muted-foreground">Manage your campaign sessions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Select
            value={status}
            onValueChange={(value) => {
              navigate({
                search: {
                  status: value as (typeof campaignStatusEnum.enumValues)[number],
                },
              });
            }}
          >
            <SelectTrigger className="w-[160px] border border-gray-300 bg-white text-gray-900 sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {campaignStatusEnum.enumValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/dashboard/campaigns/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Campaign
            </Link>
          </Button>
        </div>
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
        <>
          {/* Mobile list */}
          <div className="md:hidden">
            <List>
              {campaigns.map((c: CampaignListItem) => (
                <List.Item key={c.id} className="group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold text-gray-900">
                        {c.name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {c.recurrence}
                        </span>
                        <span className="truncate">{c.gameSystem.name}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3.5 w-3.5" /> {c.participantCount}{" "}
                        participants
                      </div>
                    </div>
                    <Link
                      to="/dashboard/campaigns/$campaignId"
                      params={{ campaignId: c.id }}
                      className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </List.Item>
              ))}
            </List>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign: CampaignListItem) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
