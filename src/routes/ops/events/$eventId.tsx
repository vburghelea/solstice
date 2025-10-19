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
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/ops/events/$eventId")({
  component: DashboardEventDetailPage,
});

function DashboardEventDetailPage() {
  const { t } = useEventsTranslation();
  const { eventId } = Route.useParams();
  const qc = useQueryClient();

  const STATUS_ACTIONS = [
    { label: t("admin.actions.publish"), status: "published" },
    { label: t("admin.actions.open_registration"), status: "registration_open" },
    { label: t("admin.actions.close_registration"), status: "registration_closed" },
    { label: t("admin.actions.start"), status: "in_progress" },
    { label: t("admin.actions.complete"), status: "completed" },
    {
      label: t("admin.actions.cancel"),
      status: "canceled",
      variant: "destructive" as const,
    },
  ] as const;

  const { data } = useSuspenseQuery({
    queryKey: ["event", eventId, "dashboard"],
    queryFn: () => getEvent({ data: { id: eventId } }),
  });

  const event = data?.success ? data.data : null;

  const mutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(t("admin.actions.event_updated"));
      } else {
        toast.error(res.errors?.[0]?.message || t("admin.actions.update_failed"));
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("admin.actions.update_failed"));
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
    return <div className="p-6">{t("admin.not_found")}</div>;
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
          <CardTitle className="text-foreground">{t("admin.registrations")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {registrations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("admin.tables.no_registrations")}
            </p>
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
                      {t("admin.actions.confirm")}
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
                      {t("admin.actions.waitlist")}
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
                      {t("admin.actions.cancel")}
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
