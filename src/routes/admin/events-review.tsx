import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  UserIcon,
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
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { listEvents } from "~/features/events/events.queries";
import type {
  EventListResult,
  EventOperationResult,
  EventWithDetails,
} from "~/features/events/events.types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";

export const Route = createFileRoute("/admin/events-review")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;
    if (!user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }

    if (!isAdminClient(user)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: EventsReviewPage,
});

function EventsReviewPage() {
  const queryClient = useQueryClient();
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
    action: "approve" | "reject";
  }>({ isOpen: false, eventId: "", eventName: "", action: "approve" });

  // Fetch pending events (drafts that want to be public)
  const { data: pendingEvents, isLoading: pendingLoading } = useQuery<
    EventListResult,
    Error
  >({
    queryKey: ["events", "pending-approval"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: "draft",
            publicOnly: false,
          },
          pageSize: 50,
        },
      }),
  });

  // Fetch recently reviewed events
  const { data: reviewedEvents, isLoading: reviewedLoading } = useQuery<
    EventListResult,
    Error
  >({
    queryKey: ["events", "reviewed"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: ["published", "registration_open"],
            publicOnly: false,
          },
          pageSize: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      }),
  });

  // Approve event mutation
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
        toast.success(approve ? "Event approved and made public!" : "Event rejected");
        queryClient.invalidateQueries({ queryKey: ["events"] });
        setApprovalDialog({
          isOpen: false,
          eventId: "",
          eventName: "",
          action: "approve",
        });
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to update event");
      }
    },
    onError: () => {
      toast.error("An error occurred while updating the event");
    },
  });

  const handleApprovalAction = () => {
    const { eventId, action } = approvalDialog;
    approveMutation.mutate({ eventId, approve: action === "approve" });
  };

  const openApprovalDialog = (
    eventId: string,
    eventName: string,
    action: "approve" | "reject",
  ) => {
    setApprovalDialog({ isOpen: true, eventId, eventName, action });
  };

  if (pendingLoading || reviewedLoading) {
    return <ReviewSkeleton />;
  }

  const pendingList = pendingEvents?.events.filter((e) => !e.isPublic) || [];
  const approvedList = reviewedEvents?.events || [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Review</h1>
          <p className="text-muted-foreground">
            Review and approve events submitted by members
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/events">View All Events</Link>
        </Button>
      </div>

      {pendingList.length === 0 && (
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>All caught up!</AlertTitle>
          <AlertDescription>
            There are no events pending approval at this time.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Recently Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Events Awaiting Approval</CardTitle>
                <CardDescription>
                  Review these events and approve them to make them public
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{event.name}</div>
                            {event.shortDescription && (
                              <div className="text-muted-foreground line-clamp-1 text-sm">
                                {event.shortDescription}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon className="text-muted-foreground h-4 w-4" />
                            <div>
                              <div className="text-sm">{event.organizer.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {event.organizer.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="text-muted-foreground h-3 w-3" />
                            <span className="text-sm">
                              {format(new Date(event.startDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.city && (
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="text-muted-foreground h-3 w-3" />
                              <span className="text-sm">
                                {event.city}
                                {event.province && `, ${event.province}`}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(event.createdAt), "MMM d")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/events/$slug" params={{ slug: event.slug }}>
                                <EyeIcon className="h-4 w-4" />
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
          ) : (
            <Card className="p-8 text-center">
              <ClockIcon className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-2">No events pending approval</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {approvedList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recently Reviewed Events</CardTitle>
                <CardDescription>
                  Events that have been recently approved or published
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedList.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{event.organizer.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {event.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.isPublic ? "default" : "secondary"}>
                            {event.isPublic ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/events/$slug" params={{ slug: event.slug }}>
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/dashboard/events/$eventId/manage"
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
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No recently reviewed events</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
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

function ReviewSkeleton() {
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
