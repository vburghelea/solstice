import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  updateEvent,
  updateEventRegistrationStatus,
} from "~/features/events/events.mutations";
import type { EventRegistrationListItem } from "~/features/events/events.queries";
import { getEvent, listEventRegistrations } from "~/features/events/events.queries";

export const Route = createFileRoute("/player/events/$eventId")({
  component: DashboardEventDetailPage,
});

const STATUS_ACTIONS = [
  { label: "Publish", status: "published" },
  { label: "Open Registration", status: "registration_open" },
  { label: "Close Registration", status: "registration_closed" },
  { label: "Start", status: "in_progress" },
  { label: "Complete", status: "completed" },
  { label: "Cancel", status: "canceled", variant: "destructive" as const },
] as const;

function DashboardEventDetailPage() {
  const { eventId } = Route.useParams();
  const qc = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: ["event", eventId, "dashboard"],
    queryFn: () => getEvent({ data: { id: eventId } }),
  });

  const event = data?.success ? data.data : null;

  const mutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Event updated");
      } else {
        toast.error(res.errors?.[0]?.message || "Failed to update event");
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    },
  });

  const registrationsQuery = useSuspenseQuery({
    queryKey: ["event", eventId, "registrations"],
    queryFn: () => listEventRegistrations({ data: { eventId } }),
  });
  const registrationsRes = registrationsQuery.data as
    | { success: true; data: EventRegistrationListItem[] }
    | { success: false };
  const registrations: EventRegistrationListItem[] = registrationsRes?.success
    ? registrationsRes.data
    : [];

  const regMutation = useMutation({
    mutationFn: updateEventRegistrationStatus,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Registration updated");
        qc.invalidateQueries({ queryKey: ["event", eventId, "registrations"] });
      } else {
        toast.error(res.errors?.[0]?.message || "Failed to update registration");
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update registration");
    },
  });

  if (!event) {
    return <div className="p-6">Event not found</div>;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">
            <p>
              Dates: {new Date(event.startDate).toLocaleDateString()} —{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
            <p className="capitalize">Type: {event.type}</p>
            <p className="capitalize">Status: {event.status}</p>
            <p>
              Registration: {event.isRegistrationOpen ? "Open" : "Closed"}
              {typeof event.availableSpots === "number"
                ? ` • ${event.availableSpots} spots left`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map((a) => {
              const variant =
                a.status === "canceled" ? ("destructive" as const) : ("outline" as const);
              return (
                <Button
                  key={a.status}
                  variant={variant}
                  size="sm"
                  onClick={() =>
                    mutation.mutate({ data: { eventId, data: { status: a.status } } })
                  }
                  disabled={mutation.isPending}
                >
                  {a.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {registrations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No registrations yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {registrations.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-foreground text-sm font-medium">
                      {r.team ? r.team.name : r.user.name}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {r.registrationType} • {r.status}
                        {r.division ? ` • ${r.division}` : ""}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {r.user.email}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={r.status === "confirmed" ? "default" : "outline"}
                      onClick={() =>
                        regMutation.mutate({
                          data: { eventId, registrationId: r.id, status: "confirmed" },
                        })
                      }
                      disabled={regMutation.isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant={r.status === "waitlisted" ? "default" : "outline"}
                      onClick={() =>
                        regMutation.mutate({
                          data: { eventId, registrationId: r.id, status: "waitlisted" },
                        })
                      }
                      disabled={regMutation.isPending}
                    >
                      Waitlist
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        regMutation.mutate({
                          data: { eventId, registrationId: r.id, status: "canceled" },
                        })
                      }
                      disabled={regMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
