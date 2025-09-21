import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useRouteContext } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  DownloadIcon,
  MailIcon,
  TrashIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
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
  AlertDialogTrigger,
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
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
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
import { cancelEvent, updateEvent } from "~/features/events/events.mutations";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import type { EventRegistrationSummary } from "~/features/events/events.queries";
import { getEvent, getEventRegistrations } from "~/features/events/events.queries";
import type {
  EventOperationResult,
  EventStatus,
  EventWithDetails,
  RegistrationType,
  UpdateEventInput,
} from "~/features/events/events.types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import { cn } from "~/shared/lib/utils";

type ManagementTab = "overview" | "registrations" | "settings";

export const Route = createFileRoute("/dashboard/events/$eventId/manage")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;
    if (!user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }

    if (!isAdminClient(user)) {
      throw redirect({ to: "/dashboard/events" });
    }
  },
  component: EventManagementPage,
});

function EventManagementPage() {
  const { eventId } = Route.useParams();
  const { user } = useRouteContext({ from: "/dashboard/events/$eventId/manage" });
  const [activeTab, setActiveTab] = useState<ManagementTab>("overview");

  // Fetch event details
  const {
    data: eventResult,
    isLoading: eventLoading,
    refetch: refetchEvent,
  } = useQuery<EventOperationResult<EventWithDetails>, Error>({
    queryKey: ["event", eventId],
    queryFn: () => getEvent({ data: { id: eventId } }),
  });

  // Fetch registrations
  const { data: registrations, isLoading: registrationsLoading } = useQuery<
    EventRegistrationSummary[],
    Error
  >({
    queryKey: ["event-registrations", eventId],
    queryFn: () => getEventRegistrations({ data: { eventId } }),
    enabled: !!eventId,
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateEventInput) =>
      unwrapServerFnResult(
        updateEvent({
          data: {
            eventId,
            data: payload,
          },
        }),
      ),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Event updated successfully");
        refetchEvent();
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to update event");
      }
    },
  });

  // Cancel event mutation
  const cancelMutation = useMutation({
    mutationFn: () =>
      unwrapServerFnResult(
        cancelEvent({ data: { eventId } }),
      ) as Promise<EventOperationResult<null>>,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Event cancelled successfully");
        refetchEvent();
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to cancel event");
      }
    },
  });

  if (eventLoading) {
    return <ManagementSkeleton />;
  }

  if (!eventResult?.success || !eventResult.data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Event Not Found</AlertTitle>
          <AlertDescription>
            The event you're trying to manage doesn't exist.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link to="/dashboard/events">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </div>
    );
  }

  const event = eventResult.data;
  const isOwner = event.organizerId === user?.id;
  const eventStatusBadge = getEventStatusBadge(event.status);
  const maxTeamsValue = typeof event.maxTeams === "number" ? event.maxTeams : undefined;
  const maxParticipantsValue =
    typeof event.maxParticipants === "number" ? event.maxParticipants : undefined;

  // Calculate statistics
  const confirmedRegistrations =
    registrations?.filter((registration) => registration.status === "confirmed") ?? [];
  const pendingRegistrations =
    registrations?.filter((registration) => registration.status === "pending") ?? [];

  const totalRevenueCents = confirmedRegistrations.reduce((sum, registration) => {
    if (registration.paymentStatus !== "paid") {
      return sum;
    }

    return sum + getRegistrationFeeInCents(registration.registrationType, event);
  }, 0);

  const handleStatusChange = (newStatus: EventStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleExportRegistrations = () => {
    if (!registrations || registrations.length === 0) {
      toast.error("No registrations to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Type",
      "Team",
      "Status",
      "Payment Status",
      "Registered At",
    ];
    const rows = registrations.map((registration) => [
      registration.userName || "",
      registration.userEmail || "",
      registration.registrationType,
      registration.teamName || "N/A",
      registration.status,
      registration.paymentStatus,
      format(new Date(registration.createdAt), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}-registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Registrations exported successfully");
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/events">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Event</h1>
            <p className="text-muted-foreground">{event.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/events/$slug" params={{ slug: event.slug }}>
              View Public Page
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ManagementTab)}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">
            Registrations
            {registrations && registrations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {registrations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <UsersIcon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedRegistrations.length}</div>
                <p className="text-muted-foreground text-xs">
                  {pendingRegistrations.length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSignIcon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {"$"}
                  {(totalRevenueCents / 100).toFixed(2)}
                </div>
                <p className="text-muted-foreground text-xs">
                  From {confirmedRegistrations.length} registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Spots</CardTitle>
                <ClockIcon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {event.availableSpots ?? "Unlimited"}
                </div>
                <p className="text-muted-foreground text-xs">
                  {maxTeamsValue !== undefined ? `of ${maxTeamsValue} teams` : ""}
                  {maxParticipantsValue !== undefined
                    ? `${maxTeamsValue !== undefined ? " / " : "of "}${maxParticipantsValue} participants`
                    : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Status</CardTitle>
                <CalendarIcon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Badge
                  variant={eventStatusBadge.variant}
                  className={cn("mb-1 capitalize", eventStatusBadge.className)}
                >
                  {event.status.replace("_", " ")}
                </Badge>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(event.startDate), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>Latest registrations for your event</CardDescription>
            </CardHeader>
            <CardContent>
              {registrations && registrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.slice(0, 5).map((registration) => {
                      const badge = getRegistrationStatusBadge(registration.status);
                      return (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">
                            {registration.userName || "Unknown"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {registration.registrationType}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={badge.variant}
                              className={cn("capitalize", badge.className)}
                            >
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {registration.paymentStatus}
                          </TableCell>
                          <TableCell>
                            {format(new Date(registration.createdAt), "MMM d")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-4 text-center">
                  No registrations yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleExportRegistrations}
                disabled={!registrations || registrations.length === 0}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export Registrations
              </Button>

              <Button variant="outline" disabled>
                <MailIcon className="mr-2 h-4 w-4" />
                Email Participants
              </Button>

              {event.status === "published" && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("registration_open")}
                >
                  Open Registration
                </Button>
              )}

              {event.status === "registration_open" && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("registration_closed")}
                >
                  Close Registration
                </Button>
              )}

              {event.status !== "cancelled" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircleIcon className="mr-2 h-4 w-4" />
                      Cancel Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the event and notify all registered participants.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep event</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate()}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Yes, cancel event
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Registrations</CardTitle>
                  <CardDescription>
                    Manage event registrations and participants
                  </CardDescription>
                </div>
                <Button onClick={handleExportRegistrations} size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="space-y-2">
                  {["row-0", "row-1", "row-2", "row-3", "row-4"].map((rowKey) => (
                    <Skeleton key={rowKey} className="h-12 w-full" />
                  ))}
                </div>
              ) : registrations && registrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => {
                      const badge = getRegistrationStatusBadge(registration.status);
                      return (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">
                            {registration.userName || "Unknown"}
                          </TableCell>
                          <TableCell>{registration.userEmail || "N/A"}</TableCell>
                          <TableCell className="capitalize">
                            {registration.registrationType}
                          </TableCell>
                          <TableCell>{registration.teamName || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={badge.variant}
                              className={cn("capitalize", badge.className)}
                            >
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {registration.paymentStatus}
                          </TableCell>
                          <TableCell>
                            {format(new Date(registration.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <UsersIcon className="text-muted-foreground mx-auto h-12 w-12" />
                  <p className="text-muted-foreground mt-2">No registrations yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
              <CardDescription>Manage event configuration and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Management */}
              <div className="space-y-2">
                <Label>Event Status</Label>
                <div className="flex gap-2">
                  <Button
                    variant={event.status === "draft" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("draft")}
                  >
                    Draft
                  </Button>
                  <Button
                    variant={event.status === "published" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("published")}
                  >
                    Published
                  </Button>
                  <Button
                    variant={event.status === "registration_open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("registration_open")}
                  >
                    Registration Open
                  </Button>
                  <Button
                    variant={
                      event.status === "registration_closed" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("registration_closed")}
                  >
                    Registration Closed
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Visibility Settings */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Public Event</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ isPublic: !event.isPublic })}
                    >
                      {event.isPublic ? "Make Private" : "Make Public"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Featured Event</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({ isFeatured: !event.isFeatured })
                      }
                    >
                      {event.isFeatured ? "Remove Feature" : "Feature Event"}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              {isOwner && (
                <div className="border-destructive/50 rounded-lg border p-4">
                  <h3 className="text-destructive mb-2 font-semibold">Danger Zone</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    These actions are permanent and cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete Event
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the event and all associated data.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground">
                          Delete Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManagementSkeleton() {
  const skeletonCards = ["card-0", "card-1", "card-2", "card-3"];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {skeletonCards.map((cardKey) => (
          <Card key={cardKey}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getEventStatusBadge(status: EventWithDetails["status"]): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  switch (status) {
    case "draft":
      return { variant: "secondary" };
    case "published":
      return { variant: "default" };
    case "registration_open":
      return {
        variant: "outline",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "registration_closed":
      return {
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "in_progress":
      return {
        variant: "outline",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "cancelled":
      return { variant: "destructive" };
    case "completed":
    default:
      return { variant: "default" };
  }
}

function getRegistrationStatusBadge(status: EventRegistrationSummary["status"]): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  switch (status) {
    case "confirmed":
      return {
        variant: "outline",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "pending":
      return {
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "cancelled":
      return { variant: "destructive" };
    case "waitlisted":
      return {
        variant: "outline",
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
    default:
      return { variant: "default" };
  }
}

function getRegistrationFeeInCents(
  registrationType: RegistrationType,
  event: EventWithDetails,
): number {
  if (registrationType === "team") {
    return event.teamRegistrationFee ?? 0;
  }

  if (registrationType === "individual") {
    return event.individualRegistrationFee ?? 0;
  }

  // Fallback for unexpected values
  return event.registrationType === "team"
    ? (event.teamRegistrationFee ?? 0)
    : (event.individualRegistrationFee ?? 0);
}
