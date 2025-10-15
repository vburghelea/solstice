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
import { participantRoleEnum } from "~/db/schema/shared.schema";
import { listCampaignsWithCount } from "~/features/campaigns/campaigns.queries";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { CampaignCard } from "~/features/campaigns/components/CampaignCard";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/gm/campaigns/")({
  component: CampaignsPage,
  validateSearch: z.object({
    status: z.enum(campaignStatusEnum.enumValues).optional(),
    userRole: z.enum(participantRoleEnum.enumValues).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
  loader: async () => {
    const result = await listCampaignsWithCount({
      data: { filters: { status: "active" }, page: 1, pageSize: 20 },
    });
    if (!result.success) {
      toast.error("Failed to load campaigns.");
      return { campaigns: [], totalCount: 0 };
    }
    return { campaigns: result.data.items, totalCount: result.data.totalCount };
  },
});

function CampaignsPage() {
  const {
    status = "active",
    userRole,
    page: searchPage,
    pageSize: searchPageSize,
  } = Route.useSearch();
  const page = Math.max(1, Number(searchPage ?? 1));
  const navigate = Route.useNavigate();

  const pageSize = Math.min(100, Math.max(1, Number(searchPageSize ?? 20)));
  const { data: campaignsData } = useSuspenseQuery({
    queryKey: ["allVisibleCampaigns", status, userRole, page, pageSize],
    queryFn: async () => {
      const result = await listCampaignsWithCount({
        data: { filters: { status, userRole }, page, pageSize },
      });
      if (!result.success) {
        toast.error("Failed to load campaigns.");
        return {
          success: false,
          errors: [{ code: "FETCH_ERROR", message: "Failed to load campaigns" }],
          data: { items: [], totalCount: 0 },
        } as const;
      }
      return result;
    },
  });

  const campaigns = campaignsData.success ? campaignsData.data.items : [];
  const totalCount = campaignsData.success ? campaignsData.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">My Campaigns</h1>
          <p className="text-muted-foreground">Manage your campaign sessions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Select
            value={status}
            onValueChange={(value) => {
              navigate({
                search: {
                  status: value as (typeof campaignStatusEnum.enumValues)[number],
                  userRole,
                },
              });
            }}
          >
            <SelectTrigger className="border-border bg-card text-foreground w-[160px] border sm:w-[180px]">
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
          <Select
            {...(userRole ? { value: userRole } : {})}
            onValueChange={(value) => {
              navigate({
                search: {
                  status,
                  userRole: value as (typeof participantRoleEnum.enumValues)[number],
                },
              });
            }}
          >
            <SelectTrigger className="border-border bg-card text-foreground w-[160px] border sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {participantRoleEnum.enumValues.map((role) => (
                <SelectItem key={role} value={role}>
                  {role === "owner"
                    ? "Organizer"
                    : role === "player"
                      ? "Participant"
                      : role === "invited"
                        ? "Invitee"
                        : "Requested"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/gm/campaigns/create">
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
              <Link to="/gm/campaigns/create">
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
                      <div className="text-foreground truncate text-base font-semibold">
                        {c.name}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {c.recurrence}
                        </span>
                        <span className="truncate">{c.gameSystem.name}</span>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                        <Users className="h-3.5 w-3.5" /> {c.participantCount}{" "}
                        participants
                      </div>
                    </div>
                    <Link
                      to="/gm/campaigns/$campaignId"
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
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                viewLink={{
                  to: "/gm/campaigns/$campaignId",
                  params: { campaignId: campaign.id },
                  from: "/gm/campaigns",
                  label: "View Campaign",
                }}
              />
            ))}
          </div>
        </>
      )}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Page {page} of {totalPages} • {totalCount} total
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                search: { status, userRole, page: Math.max(1, page - 1), pageSize },
              })
            }
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                search: {
                  status,
                  userRole,
                  page: Math.min(totalPages, page + 1),
                  pageSize,
                },
              })
            }
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
