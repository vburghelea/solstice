import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { addDays, differenceInCalendarDays, format, isWithinInterval } from "date-fns";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  ShieldAlertIcon,
  SparklesIcon,
  Users2Icon,
  XCircleIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { listEvents } from "~/features/events/events.queries";
import type {
  EventListResult,
  EventOperationResult,
  EventStatus,
  EventWithDetails,
} from "~/features/events/events.types";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { cn } from "~/shared/lib/utils";

const PIPELINE_STATUSES: EventStatus[] = ["registration_open", "published", "completed"];

const CAPACITY_THRESHOLD = 5;

export function OpsOverviewDashboard() {
  const queryClient = useQueryClient();
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
    action: "approve" | "reject";
  }>({ isOpen: false, eventId: "", eventName: "", action: "approve" });

  const {
    data: pendingEvents,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
  } = useQuery<EventListResult, Error>({
    queryKey: ["ops", "events", "pending"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: "draft",
            publicOnly: false,
          },
          pageSize: 50,
          sortBy: "createdAt",
          sortOrder: "asc",
        },
      }),
  });

  const {
    data: pipelineEvents,
    isLoading: pipelineLoading,
    isFetching: pipelineFetching,
  } = useQuery<EventListResult, Error>({
    queryKey: ["ops", "events", "pipeline"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: PIPELINE_STATUSES,
            publicOnly: false,
          },
          pageSize: 75,
          sortBy: "startDate",
          sortOrder: "asc",
        },
      }),
  });

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
        queryClient.setQueryData<EventListResult | undefined>(
          ["ops", "events", "pending"],
          (previous) => previous,
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

  const pendingList = useMemo(
    () => pendingEvents?.events.filter((event) => !event.isPublic) ?? [],
    [pendingEvents],
  );

  const pipelineList = useMemo(() => pipelineEvents?.events ?? [], [pipelineEvents]);

  const snapshot = useMemo(() => {
    const now = new Date();
    const registrationOpen = pipelineList.filter(
      (event) => event.status === "registration_open",
    ).length;
    const confirmedEvents = pipelineList.filter(
      (event) => event.status === "published",
    ).length;
    const upcomingWeek = pipelineList.filter((event) => {
      const start = new Date(event.startDate);
      const diff = differenceInCalendarDays(start, now);
      return diff >= 0 && diff <= 7;
    }).length;
    const capacityAlerts = pipelineList.filter((event) => {
      if (typeof event.availableSpots !== "number") {
        return false;
      }
      return event.availableSpots <= CAPACITY_THRESHOLD;
    }).length;

    return {
      approvals: pendingList.length,
      registrationOpen,
      confirmedEvents,
      upcomingWeek,
      capacityAlerts,
    };
  }, [pendingList, pipelineList]);

  const attentionItems = useMemo(() => {
    const now = new Date();
    return pipelineList
      .map((event) => {
        const startDate = new Date(event.startDate);
        const daysUntilStart = differenceInCalendarDays(startDate, now);
        const availableSpots = event.availableSpots;
        const lowCapacity =
          typeof availableSpots === "number" && availableSpots <= CAPACITY_THRESHOLD;
        const severity =
          daysUntilStart <= 2 || lowCapacity
            ? "critical"
            : daysUntilStart <= 7
              ? "warning"
              : "info";
        const message =
          severity === "critical"
            ? "Confirm staffing, safety briefings, and arrival logistics"
            : severity === "warning"
              ? "Schedule marketing boost and finalize vendor confirmations"
              : "Review run-of-show document and volunteer assignments";

        return {
          id: event.id,
          name: event.name,
          severity,
          message,
          startDate,
          availableSpots,
          city: event.city,
        };
      })
      .filter((item) => item.severity !== "info")
      .slice(0, 4);
  }, [pipelineList]);

  const marketingBreakdown = useMemo(() => {
    const now = new Date();
    const grouped = new Map<string, { total: number; upcoming: number }>();
    pipelineList.forEach((event) => {
      const key = event.city
        ? `${event.city}${event.country ? `, ${event.country}` : ""}`
        : "Unlisted";
      const entry = grouped.get(key) ?? { total: 0, upcoming: 0 };
      entry.total += 1;
      if (
        isWithinInterval(new Date(event.startDate), {
          start: now,
          end: addDays(now, 30),
        })
      ) {
        entry.upcoming += 1;
      }
      grouped.set(key, entry);
    });

    return Array.from(grouped.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5);
  }, [pipelineList]);

  const liveEvents = useMemo(() => pipelineList.slice(0, 10), [pipelineList]);

  const isLoading = pendingLoading || pipelineLoading;

  if (isLoading) {
    return <OpsOverviewSkeleton />;
  }

  const isRefreshing = pendingFetching || pipelineFetching || approveMutation.isPending;

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
            <Link to="/dashboard/events">View legacy dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/events/create">Launch new event</Link>
          </Button>
        </div>
      </div>

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

      {isRefreshing && (
        <Alert variant="default">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Refreshing data</AlertTitle>
          <AlertDescription>
            Pulling the latest submissions, staffing counts, and campaign stats.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={pendingList.length > 0 ? "approvals" : "pipeline"}>
        <TabsList>
          <TabsTrigger value="approvals">
            Approvals queue
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingList.length}
              </Badge>
            )}
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
                              <CheckCircle2Icon className="mr-1 h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                openApprovalDialog(event.id, event.name, "reject")
                              }
                            >
                              <XCircleIcon className="mr-1 h-4 w-4" /> Revise
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
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="space-y-1">
                <CardTitle>Live pipeline</CardTitle>
                <CardDescription>
                  Track registration momentum and logistics status for the next wave of
                  events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liveEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <p className="text-muted-foreground text-sm">
                      No events in the operations pipeline right now. Approve a submission
                      to populate this view.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registrations</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveEvents.map((event) => {
                        const availableSpots = event.availableSpots;
                        const percentFull =
                          typeof availableSpots === "number" &&
                          event.registrationCount + availableSpots > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (event.registrationCount /
                                    (event.registrationCount + availableSpots)) *
                                    100,
                                ),
                              )
                            : null;
                        const statusLabel = event.status.replace("_", " ");
                        return (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div>{event.name}</div>
                                <p className="text-muted-foreground text-xs">
                                  {event.city
                                    ? `${event.city}${event.country ? `, ${event.country}` : ""}`
                                    : "Location pending"}
                                </p>
                              </div>
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
                                    availableSpots <= CAPACITY_THRESHOLD
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
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    to="/dashboard/events/$eventId/manage"
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
                      <div key={item.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="leading-tight font-medium">{item.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {format(item.startDate, "MMM d")} ·{" "}
                              {item.city ?? "Location TBD"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              item.severity === "critical" ? "destructive" : "secondary"
                            }
                            className="capitalize"
                          >
                            {item.severity === "critical" ? "Urgent" : "Monitor"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.message}</p>
                        {typeof item.availableSpots === "number" ? (
                          <p className="text-xs font-medium">
                            {item.availableSpots} spots remaining
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Marketing hotspots</CardTitle>
                <CardDescription>
                  Cities driving the highest volume of upcoming events in the next 30
                  days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketingBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Approve new submissions to start building regional insights.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {marketingBreakdown.map(([location, stats]) => (
                      <div key={location} className="flex items-center justify-between">
                        <div>
                          <p className="leading-tight font-medium">{location}</p>
                          <p className="text-muted-foreground text-xs">
                            {stats.upcoming} happening soon · {stats.total} total in
                            pipeline
                          </p>
                        </div>
                        <Badge variant="outline">{stats.total}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Operational focus</CardTitle>
                <CardDescription>
                  Prep checklists to keep Priya aligned with on-site teams.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="bg-muted/50 rounded-md p-3">
                    <p className="font-medium">Finalize runbooks</p>
                    <p className="text-muted-foreground">
                      Share safety protocols, vendor contacts, and escalation paths 48
                      hours before event start.
                    </p>
                  </li>
                  <li className="bg-muted/50 rounded-md p-3">
                    <p className="font-medium">Align staffing rosters</p>
                    <p className="text-muted-foreground">
                      Confirm volunteer leads and send briefing survey to capture
                      last-minute blockers.
                    </p>
                  </li>
                  <li className="bg-muted/50 rounded-md p-3">
                    <p className="font-medium">Close the feedback loop</p>
                    <p className="text-muted-foreground">
                      Schedule follow-up surveys for events marked complete to fuel
                      continuous improvement.
                    </p>
                  </li>
                </ul>
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
                ? "Approve event"
                : "Request revisions"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalDialog.action === "approve"
                ? `Go-live will move "${approvalDialog.eventName}" into Priya's operations pipeline.`
                : `We'll notify the organizer that "${approvalDialog.eventName}" needs updates before it can launch.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                approveMutation.mutate({
                  eventId: approvalDialog.eventId,
                  approve: approvalDialog.action === "approve",
                })
              }
              className={cn(
                "font-semibold",
                approvalDialog.action === "reject"
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : undefined,
              )}
            >
              {approvalDialog.action === "approve" ? "Approve" : "Send back"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              tone === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </span>
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {label}
            </p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function OpsOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["approvals", "live", "confirmed", "alerts"].map((key) => (
          <Card key={`metric-skeleton-${key}`}>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["row-one", "row-two", "row-three"].map((key) => (
              <Skeleton key={`table-skeleton-${key}`} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
