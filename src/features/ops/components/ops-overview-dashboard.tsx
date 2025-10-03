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
import { SafeLink as Link } from "~/components/ui/SafeLink";

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
            ? "Event approved and moved to the operations pipeline"
            : "Event returned for revisions",
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
        const message = result.errors?.[0]?.message || "Failed to update event";
        toast.error(message);
        queryClient.setQueryData(
          ["ops", "events", "pending"],
          (previous: unknown) => previous,
        );
      }
    },
    onError: () => {
      toast.error("An error occurred while updating the event");
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
        title: "Approve the next submission",
        description: `${event.name} is queued to go live once you give the green light. Double-check organizer details and publish when ready.`,
        meta: `${format(new Date(event.startDate), "MMM d")} · ${event.city ?? "Location TBD"}`,
        ctaHref: "/admin/events-review",
        ctaLabel: "Review submission",
      };
    }

    if (attentionItems.length > 0) {
      const item = attentionItems[0];
      return {
        tone: item.severity === "critical" ? "critical" : "warning",
        title:
          item.severity === "critical"
            ? "Urgent logistics check"
            : "Monitor marketing pulse",
        description: item.message,
        meta: `${format(item.startDate, "MMM d")} · ${item.city ?? "Location TBD"}`,
        ctaHref: "/ops/events",
        ctaLabel: "Open event roster",
      };
    }

    if (pipelineList.length > 0) {
      const event = pipelineList[0];
      return {
        tone: "default",
        title: "Stay ahead of the pipeline",
        description: `${event.name} is the next confirmed experience. Review staffing notes and marketing pushes to keep momentum strong.`,
        meta: `${format(new Date(event.startDate), "MMM d")} · ${event.city ?? "Location TBD"}`,
        ctaHref: `/ops/events/${event.id}`,
        ctaLabel: "Open ops view",
      };
    }

    return null;
  }, [attentionItems, pendingList, pipelineList]);

  if (isLoading) {
    return <OpsOverviewSkeleton />;
  }

  const isRefreshingData = isRefreshing || approveMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-primary/10 text-primary w-fit">
            Priya · Operations Strategist
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Event operations mission control
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Keep approvals, staffing, and marketing signals aligned in one workspace so
            Priya can steer live experiences without leaving the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/ops/events">View legacy dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/ops/events/create">Launch new event</Link>
          </Button>
        </div>
      </div>

      {focusTarget ? <FocusBanner target={focusTarget} /> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SnapshotCard
          icon={<ClockIcon className="h-5 w-5" />}
          label="Awaiting review"
          value={snapshot.approvals}
          description="Submissions queued for operations approval"
        />
        <SnapshotCard
          icon={<SparklesIcon className="h-5 w-5" />}
          label="Registration live"
          value={snapshot.registrationOpen}
          description="Campaigns actively collecting signups"
        />
        <SnapshotCard
          icon={<Users2Icon className="h-5 w-5" />}
          label="Confirmed events"
          value={snapshot.confirmedEvents}
          description="Published and ready for execution"
        />
        <SnapshotCard
          icon={<ShieldAlertIcon className="h-5 w-5" />}
          label="Capacity alerts"
          value={snapshot.capacityAlerts}
          description="Tables approaching waitlist thresholds"
          tone={snapshot.capacityAlerts > 0 ? "warning" : "default"}
        />
      </div>

      {isRefreshingData ? (
        <Alert variant="default">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Refreshing data</AlertTitle>
          <AlertDescription>
            Pulling the latest submissions, staffing counts, and campaign stats.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue={pendingList.length > 0 ? "approvals" : "pipeline"}>
        <TabsList>
          <TabsTrigger value="approvals">
            Approvals queue
            {pendingList.length > 0 ? (
              <Badge variant="destructive" className="ml-2">
                {pendingList.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline health</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          {pendingList.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2Icon className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-2">
                Every submission has been triaged — enjoy a moment to breathe.
              </p>
            </Card>
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Events awaiting go-live</CardTitle>
                <CardDescription>
                  Review organizer details, skim logistics, and approve or send back
                  revisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              {event.organizer?.name ?? "Unknown"}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {event.organizer?.email ?? "Not provided"}
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
                            <span className="text-muted-foreground text-sm">TBD</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(event.createdAt), "MMM d")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/events/$slug" params={{ slug: event.slug }}>
                                Preview
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                openApprovalDialog(event.id, event.name, "approve")
                              }
                            >
                              <CheckCircleIcon className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                openApprovalDialog(event.id, event.name, "reject")
                              }
                            >
                              <XCircleIcon className="mr-1 h-4 w-4" />
                              Reject
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
              <CardTitle>Recent approvals</CardTitle>
              <CardDescription>
                Keep a pulse on which experiences moved forward and jump back into
                operations if adjustments are needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentlyReviewed.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Once events are approved they will appear here with quick links to
                  manage rosters and logistics.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                            {event.isPublic ? "Public" : "Private"}
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
                            <Button asChild size="sm">
                              <Link
                                to="/ops/events/$eventId"
                                params={{ eventId: event.id }}
                              >
                                Tasks & notes
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link to="/events/$slug" params={{ slug: event.slug }}>
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/ops/events/$eventId/manage"
                                params={{ eventId: event.id }}
                              >
                                Manage
                              </Link>
                            </Button>
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
              <CardTitle>Pipeline health</CardTitle>
              <CardDescription>
                Monitor registrations, capacity, and readiness for the upcoming slate of
                events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipelineList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No events found in the pipeline. Keep approvals moving to populate this
                  view.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                : "Location pending"}
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
                                {availableSpots} spots left
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Unlimited
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
                              <Button asChild size="sm">
                                <Link
                                  to="/ops/events/$eventId"
                                  params={{ eventId: event.id }}
                                >
                                  Tasks & notes
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to="/ops/events/$eventId/manage"
                                  params={{ eventId: event.id }}
                                >
                                  Manage
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="ghost">
                                <Link to="/events/$slug" params={{ slug: event.slug }}>
                                  View
                                </Link>
                              </Button>
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
              <CardTitle>Logistics watchlist</CardTitle>
              <CardDescription>
                Upcoming events that need final staffing or marketing coordination.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attentionItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All systems are green — keep monitoring registration momentum.
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
                <CardTitle>Marketing hotspots</CardTitle>
                <CardDescription>
                  Cities generating the most volume and near-term activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketingBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No marketing trends available yet. Approve more events to surface
                    hotspots.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {marketingBreakdown.map(([location, stats]) => (
                      <div key={location} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{location}</p>
                          <p className="text-muted-foreground text-xs">
                            {stats.upcoming} launching in the next 30 days
                          </p>
                        </div>
                        <Badge variant="outline">{stats.total} live</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Live event command list</CardTitle>
                <CardDescription>
                  Quick links to adjust staffing or check rosters for imminent
                  experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liveEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No live events yet — approvals will populate this list automatically.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {liveEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="leading-tight font-medium">{event.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(event.startDate), "MMM d")} ·{" "}
                            {event.city ?? "Location TBD"}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/ops/events/$eventId/manage"
                            params={{ eventId: event.id }}
                          >
                            Adjust
                          </Link>
                        </Button>
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
              {approvalDialog.action === "approve" ? "Approve Event" : "Reject Event"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalDialog.action === "approve"
                ? `Are you sure you want to approve "${approvalDialog.eventName}"? This will make the event publicly visible.`
                : `Are you sure you want to reject "${approvalDialog.eventName}"? The organizer will need to make changes and resubmit.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovalAction}
              className={
                approvalDialog.action === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {approvalDialog.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FocusBanner({ target }: { target: FocusTarget }) {
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
              Mission focus
            </p>
            <h2 className="text-xl leading-tight font-semibold">{target.title}</h2>
            <p className="text-muted-foreground text-sm">{target.description}</p>
            <p className="text-muted-foreground text-xs font-medium">{target.meta}</p>
          </div>
        </div>
        <Button asChild variant={buttonVariant} className="self-start">
          <Link to={target.ctaHref}>{target.ctaLabel}</Link>
        </Button>
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
  const tone = item.severity === "critical" ? "destructive" : "secondary";
  const daysUntilStart = differenceInCalendarDays(item.startDate, new Date());

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="leading-tight font-medium">{item.name}</p>
          <p className="text-muted-foreground text-xs">
            {format(item.startDate, "MMM d")} · {item.city ?? "Location TBD"}
          </p>
        </div>
        <Badge variant={tone} className="capitalize">
          {item.severity === "critical" ? "Urgent" : "Monitor"}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{item.message}</p>
      {typeof item.availableSpots === "number" ? (
        <p className="text-xs font-medium">
          {item.availableSpots} spots remaining · {Math.max(daysUntilStart, 0)} days out
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
