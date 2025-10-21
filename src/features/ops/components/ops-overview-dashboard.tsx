import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  ShieldAlertIcon,
  SparklesIcon,
  Users2Icon,
  XCircleIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { updateEvent } from "~/features/events/events.mutations";
import type {
  EventOperationResult,
  EventWithDetails,
} from "~/features/events/events.types";
import { useCommonTranslation, useOpsTranslation } from "~/hooks/useTypedTranslation";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { cn } from "~/shared/lib/utils";

import {
  opsCapacityThreshold,
  useOpsEventsData,
  type OpsAttentionItem,
} from "./use-ops-events-data";

type FocusTone = "default" | "warning" | "critical";

interface FocusTarget {
  tone: FocusTone;
  title: string;
  description: string;
  meta: string;
  ctaHref: string;
  ctaLabel: string;
}

export function OpsOverviewDashboard() {
  const { t } = useOpsTranslation();
  const { t: commonT } = useCommonTranslation();
  const queryClient = useQueryClient();
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
    action: "approve" | "reject";
  }>({ isOpen: false, eventId: "", eventName: "", action: "approve" });

  const {
    pendingList,
    pipelineList,
    recentlyReviewed,
    snapshot,
    attentionItems,
    marketingBreakdown,
    liveEvents,
    isLoading,
    isRefreshing,
  } = useOpsEventsData();

  const approveMutation = useMutation<
    EventOperationResult<EventWithDetails>,
    Error,
    { eventId: string; approve: boolean }
  >({
    mutationFn: async ({ eventId, approve }) =>
      unwrapServerFnResult(
        updateEvent({
          data: {
            eventId,
            data: {
              isPublic: approve,
              status: approve ? "published" : "draft",
            },
          },
        }),
      ),
    onSuccess: (result, { approve }) => {
      if (result.success) {
        toast.success(
          approve
            ? t("approval_dialog.success_approved")
            : t("approval_dialog.success_rejected"),
        );
        void queryClient.invalidateQueries({ queryKey: ["ops", "events"] });
        void queryClient.invalidateQueries({ queryKey: ["events"] });
        setApprovalDialog({
          isOpen: false,
          eventId: "",
          eventName: "",
          action: "approve",
        });
      } else {
        const message = result.errors?.[0]?.message || t("approval_dialog.error_update");
        toast.error(message);
        queryClient.setQueryData(
          ["ops", "events", "pending"],
          (previous: unknown) => previous,
        );
      }
    },
    onError: () => {
      toast.error(t("approval_dialog.error_occurred"));
    },
  });

  const openApprovalDialog = (
    eventId: string,
    eventName: string,
    action: "approve" | "reject",
  ) => {
    setApprovalDialog({ isOpen: true, eventId, eventName, action });
  };

  const handleApprovalAction = () => {
    const { eventId, action } = approvalDialog;
    approveMutation.mutate({ eventId, approve: action === "approve" });
  };

  const focusTarget = useMemo<FocusTarget | null>(() => {
    if (pendingList.length > 0) {
      const event = pendingList[0];
      return {
        tone: "critical",
        title: t("pipeline.next_submission"),
        description: `${event.name} is queued to go live once you give the green light. Double-check organizer details and publish when ready.`,
        meta: `${format(new Date(event.startDate), "MMM d")} · ${event.city ?? t("pipeline.location_tbd")}`,
        ctaHref: "/admin/events-review",
        ctaLabel: t("pipeline.review_submission"),
      };
    }

    if (attentionItems.length > 0) {
      const item = attentionItems[0];
      return {
        tone: item.severity === "critical" ? "critical" : "warning",
        title:
          item.severity === "critical"
            ? t("pipeline.urgent_logistics")
            : t("pipeline.monitor_marketing"),
        description: item.message,
        meta: `${format(item.startDate, "MMM d")} · ${item.city ?? t("pipeline.location_tbd")}`,
        ctaHref: "/ops/events",
        ctaLabel: t("pipeline.open_roster"),
      };
    }

    if (pipelineList.length > 0) {
      const event = pipelineList[0];
      return {
        tone: "default",
        title: t("pipeline.stay_ahead"),
        description: `${event.name} is the next confirmed experience. Review staffing notes and marketing pushes to keep momentum strong.`,
        meta: `${format(new Date(event.startDate), "MMM d")} · ${event.city ?? t("pipeline.location_tbd")}`,
        ctaHref: `/ops/events/${event.id}`,
        ctaLabel: t("pipeline.open_ops_view"),
      };
    }

    return null;
  }, [attentionItems, pendingList, pipelineList, t]);

  if (isLoading) {
    return <OpsOverviewSkeleton />;
  }

  const isRefreshingData = isRefreshing || approveMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground max-w-2xl">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LocalizedButtonLink
            to="/ops/events"
            translationKey="operations.legacy_dashboard"
            translationNamespace="navigation"
            fallbackText={t("dashboard.legacy_dashboard_link")}
            variant="secondary"
          />
          <LocalizedButtonLink
            to="/ops/events/create"
            translationKey="operations.launch_event"
            translationNamespace="navigation"
            fallbackText={t("dashboard.launch_event")}
          />
        </div>
      </div>

      {focusTarget ? <FocusBanner target={focusTarget} /> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SnapshotCard
          icon={<ClockIcon className="h-5 w-5" />}
          label={t("snapshot_cards.awaiting_review")}
          value={snapshot.approvals}
          description={t("snapshot_cards.awaiting_review_description")}
        />
        <SnapshotCard
          icon={<SparklesIcon className="h-5 w-5" />}
          label={t("snapshot_cards.registration_live")}
          value={snapshot.registrationOpen}
          description={t("snapshot_cards.registration_live_description")}
        />
        <SnapshotCard
          icon={<Users2Icon className="h-5 w-5" />}
          label={t("snapshot_cards.confirmed_events")}
          value={snapshot.confirmedEvents}
          description={t("snapshot_cards.confirmed_events_description")}
        />
        <SnapshotCard
          icon={<ShieldAlertIcon className="h-5 w-5" />}
          label={t("snapshot_cards.capacity_alerts")}
          value={snapshot.capacityAlerts}
          description={t("snapshot_cards.capacity_alerts_description")}
          tone={snapshot.capacityAlerts > 0 ? "warning" : "default"}
        />
      </div>

      {isRefreshingData ? (
        <Alert variant="default">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>{t("status_messages.refreshing_data")}</AlertTitle>
          <AlertDescription>
            {t("status_messages.refreshing_data_description")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue={pendingList.length > 0 ? "approvals" : "pipeline"}>
        <TabsList>
          <TabsTrigger value="approvals">
            {t("tabs.approvals_queue")}
            {pendingList.length > 0 ? (
              <Badge variant="destructive" className="ml-2">
                {pendingList.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pipeline">{t("tabs.pipeline_health")}</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          {pendingList.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2Icon className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-2">
                {t("empty_states.all_triaged")}
              </p>
            </Card>
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>{t("sections.events_awaiting_approval")}</CardTitle>
                <CardDescription>
                  {t("sections.events_awaiting_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table_headers.event")}</TableHead>
                      <TableHead>{t("table_headers.organizer")}</TableHead>
                      <TableHead>{t("table_headers.type")}</TableHead>
                      <TableHead>{t("table_headers.start")}</TableHead>
                      <TableHead>{t("table_headers.location")}</TableHead>
                      <TableHead>{t("table_headers.created")}</TableHead>
                      <TableHead className="text-right">
                        {t("table_headers.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{event.name}</div>
                            {event.shortDescription ? (
                              <p className="text-muted-foreground line-clamp-1 text-xs">
                                {event.shortDescription}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">
                              {event.organizer?.name ?? t("labels.unknown")}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {event.organizer?.email ?? t("labels.not_provided")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="text-muted-foreground h-3 w-3" />
                            {format(new Date(event.startDate), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.city ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPinIcon className="text-muted-foreground h-3 w-3" />
                              <span>
                                {event.city}
                                {event.country ? `, ${event.country}` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t("labels.tbd")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(event.createdAt), "MMM d")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <LocalizedButtonLink
                              to="/events/$slug"
                              params={{ slug: event.slug }}
                              translationKey="operations.preview_event"
                              translationNamespace="navigation"
                              fallbackText={t("actions.preview")}
                              size="sm"
                              variant="outline"
                            />
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                openApprovalDialog(event.id, event.name, "approve")
                              }
                            >
                              <CheckCircleIcon className="mr-1 h-4 w-4" />
                              {t("actions.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                openApprovalDialog(event.id, event.name, "reject")
                              }
                            >
                              <XCircleIcon className="mr-1 h-4 w-4" />
                              {t("actions.reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>{t("sections.recent_approvals")}</CardTitle>
              <CardDescription>
                {t("hardcoded_strings.recent_approvals_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentlyReviewed.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("hardcoded_strings.no_recent_approvals")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("hardcoded_strings.table_headers.event")}</TableHead>
                      <TableHead>{t("hardcoded_strings.table_headers.status")}</TableHead>
                      <TableHead>
                        {t("hardcoded_strings.table_headers.visibility")}
                      </TableHead>
                      <TableHead>
                        {t("hardcoded_strings.table_headers.updated")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("hardcoded_strings.actions.view")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentlyReviewed.slice(0, 8).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {event.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.isPublic ? "default" : "secondary"}>
                            {event.isPublic
                              ? t("hardcoded_strings.visibility.public")
                              : t("hardcoded_strings.visibility.private")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {format(
                              new Date(event.updatedAt ?? event.createdAt),
                              "MMM d",
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <LocalizedButtonLink
                              to="/ops/events/$eventId"
                              params={{ eventId: event.id }}
                              translationKey="operations.view_tasks_notes"
                              translationNamespace="navigation"
                              fallbackText={t("hardcoded_strings.actions.tasks_notes")}
                              size="sm"
                            />
                            <LocalizedButtonLink
                              to="/events/$slug"
                              params={{ slug: event.slug }}
                              translationKey="operations.view_event"
                              translationNamespace="navigation"
                              fallbackText={t("hardcoded_strings.actions.view")}
                              size="sm"
                              variant="outline"
                            />
                            <LocalizedButtonLink
                              to="/ops/events/$eventId/manage"
                              params={{ eventId: event.id }}
                              translationKey="operations.manage_event"
                              translationNamespace="navigation"
                              fallbackText={t("hardcoded_strings.actions.manage")}
                              size="sm"
                              variant="outline"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>{t("hardcoded_strings.pipeline_health.title")}</CardTitle>
              <CardDescription>
                {t("hardcoded_strings.pipeline_health.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipelineList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("hardcoded_strings.pipeline_health.no_events")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("hardcoded_strings.table_headers.event")}</TableHead>
                      <TableHead>{t("hardcoded_strings.table_headers.status")}</TableHead>
                      <TableHead>
                        {t("hardcoded_strings.table_headers.registered")}
                      </TableHead>
                      <TableHead>
                        {t("hardcoded_strings.table_headers.capacity")}
                      </TableHead>
                      <TableHead>{t("hardcoded_strings.table_headers.start")}</TableHead>
                      <TableHead className="text-right">
                        {t("hardcoded_strings.actions.view")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineList.map((event) => {
                      const statusLabel = event.status.replace("_", " ");
                      const availableSpots = event.availableSpots ?? null;
                      const percentFull =
                        typeof event.registrationCount === "number" &&
                        typeof availableSpots === "number" &&
                        availableSpots >= 0
                          ? Math.min(
                              Math.round(
                                (event.registrationCount /
                                  (event.registrationCount + availableSpots)) *
                                  100,
                              ),
                              100,
                            )
                          : null;

                      return (
                        <TableRow key={event.id}>
                          <TableCell className="space-y-1 font-medium">
                            <div>{event.name}</div>
                            <p className="text-muted-foreground text-xs">
                              {event.city
                                ? `${event.city}${event.country ? `, ${event.country}` : ""}`
                                : t("pipeline.location_tbd")}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {event.registrationCount}
                              </div>
                              {percentFull !== null ? (
                                <div className="bg-muted h-1.5 rounded-full">
                                  <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${percentFull}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {typeof availableSpots === "number" ? (
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  availableSpots <= opsCapacityThreshold
                                    ? "text-amber-600"
                                    : "text-muted-foreground",
                                )}
                              >
                                {t("hardcoded_strings.pipeline_health.spots_left", {
                                  count: availableSpots,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t("hardcoded_strings.pipeline_health.unlimited")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {format(new Date(event.startDate), "MMM d")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <LocalizedButtonLink
                                to="/ops/events/$eventId"
                                params={{ eventId: event.id }}
                                translationKey="operations.view_tasks_notes"
                                translationNamespace="navigation"
                                fallbackText={t("hardcoded_strings.actions.tasks_notes")}
                                size="sm"
                              />
                              <LocalizedButtonLink
                                to="/ops/events/$eventId/manage"
                                params={{ eventId: event.id }}
                                translationKey="operations.manage_event"
                                translationNamespace="navigation"
                                fallbackText={t("hardcoded_strings.actions.manage")}
                                size="sm"
                                variant="outline"
                              />
                              <LocalizedButtonLink
                                to="/events/$slug"
                                params={{ slug: event.slug }}
                                translationKey="operations.view_event"
                                translationNamespace="navigation"
                                fallbackText={t("hardcoded_strings.actions.view")}
                                size="sm"
                                variant="ghost"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>{t("hardcoded_strings.logistics_watchlist.title")}</CardTitle>
              <CardDescription>
                {t("hardcoded_strings.logistics_watchlist.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attentionItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("hardcoded_strings.logistics_watchlist.no_issues")}
                </p>
              ) : (
                <div className="space-y-4">
                  {attentionItems.map((item) => (
                    <WatchlistItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>{t("hardcoded_strings.marketing_hotspots.title")}</CardTitle>
                <CardDescription>
                  {t("hardcoded_strings.marketing_hotspots.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketingBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t("hardcoded_strings.marketing_hotspots.no_data")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {marketingBreakdown.map(([location, stats]) => (
                      <div key={location} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{location}</p>
                          <p className="text-muted-foreground text-xs">
                            {t("hardcoded_strings.marketing_hotspots.launching_soon", {
                              count: stats.upcoming,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {t("hardcoded_strings.marketing_hotspots.live", {
                            count: stats.total,
                          })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>{t("hardcoded_strings.live_command_list.title")}</CardTitle>
                <CardDescription>
                  {t("hardcoded_strings.live_command_list.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liveEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t("hardcoded_strings.live_command_list.no_events")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {liveEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="leading-tight font-medium">{event.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(event.startDate), "MMM d")} ·{" "}
                            {event.city ?? t("labels.tbd")}
                          </p>
                        </div>
                        <LocalizedButtonLink
                          to="/ops/events/$eventId/manage"
                          params={{ eventId: event.id }}
                          translationKey="operations.adjust_event"
                          translationNamespace="navigation"
                          fallbackText={t("hardcoded_strings.actions.adjust")}
                          size="sm"
                          variant="outline"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={approvalDialog.isOpen}
        onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, isOpen: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalDialog.action === "approve"
                ? t("approval_dialog.approve_event")
                : t("approval_dialog.reject_event")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalDialog.action === "approve"
                ? t("approval_dialog.approve_description")
                : t("approval_dialog.reject_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{commonT("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovalAction}
              className={
                approvalDialog.action === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {approvalDialog.action === "approve"
                ? t("approval_dialog.confirm_approve")
                : t("approval_dialog.confirm_reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FocusBanner({ target }: { target: FocusTarget }) {
  const { t } = useOpsTranslation();
  const toneStyles: Record<FocusTone, string> = {
    default: "border-primary/30 bg-primary/5",
    warning: "border-amber-200 bg-amber-50",
    critical: "border-destructive/50 bg-destructive/10",
  };

  const toneIcon: Record<FocusTone, ReactNode> = {
    default: <SparklesIcon className="text-primary h-5 w-5" />,
    warning: <AlertCircleIcon className="h-5 w-5 text-amber-600" />,
    critical: <ShieldAlertIcon className="text-destructive h-5 w-5" />,
  };

  const buttonVariant =
    target.tone === "critical"
      ? "destructive"
      : target.tone === "warning"
        ? "secondary"
        : "default";

  return (
    <Card className={cn("border", toneStyles[target.tone])}>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{toneIcon[target.tone]}</div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {t("hardcoded_strings.mission_focus")}
            </p>
            <h2 className="text-xl leading-tight font-semibold">{target.title}</h2>
            <p className="text-muted-foreground text-sm">{target.description}</p>
            <p className="text-muted-foreground text-xs font-medium">{target.meta}</p>
          </div>
        </div>
        <LocalizedButtonLink
          to={target.ctaHref}
          translationKey="operations.focus_action"
          translationNamespace="navigation"
          fallbackText={target.ctaLabel}
          variant={buttonVariant}
          className="self-start"
        />
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  icon,
  label,
  value,
  description,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  tone?: FocusTone;
}) {
  const toneClasses: Record<FocusTone, string> = {
    default: "border-border",
    warning: "border-amber-200",
    critical: "border-destructive/60",
  };

  return (
    <Card className={cn("border", toneClasses[tone])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function WatchlistItem({ item }: { item: OpsAttentionItem }) {
  const { t } = useOpsTranslation();
  const tone = item.severity === "critical" ? "destructive" : "secondary";
  const daysUntilStart = differenceInCalendarDays(item.startDate, new Date());

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="leading-tight font-medium">{item.name}</p>
          <p className="text-muted-foreground text-xs">
            {format(item.startDate, "MMM d")} · {item.city ?? t("labels.tbd")}
          </p>
        </div>
        <Badge variant={tone} className="capitalize">
          {item.severity === "critical"
            ? t("hardcoded_strings.logistics_watchlist.urgent")
            : t("hardcoded_strings.logistics_watchlist.monitor")}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{item.message}</p>
      {typeof item.availableSpots === "number" ? (
        <p className="text-xs font-medium">
          {t("hardcoded_strings.logistics_watchlist.spots_remaining", {
            count: item.availableSpots,
            days: Math.max(daysUntilStart, 0),
          })}
        </p>
      ) : null}
    </div>
  );
}

function OpsOverviewSkeleton() {
  const skeletonRows = ["pending-0", "pending-1", "pending-2"];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {skeletonRows.map((rowKey) => (
              <Skeleton key={rowKey} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
