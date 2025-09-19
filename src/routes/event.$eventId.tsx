import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { useAuth } from "~/features/auth/hooks/useAuth";
import { registerForEvent } from "~/features/events/events.mutations";
import { getEvent } from "~/features/events/events.queries";
import { PublicLayout } from "~/features/layouts/public-layout";
import { getUserTeams } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/event/$eventId")({
  component: PublicEventDetailPage,
});

function PublicEventDetailPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data } = useSuspenseQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent({ data: { id: eventId } }),
  });

  // Define hooks before early returns
  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Registration submitted");
      } else {
        toast.error(res.errors?.[0]?.message || "Failed to register");
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to register");
    },
  });

  // Only show public events that are scheduled for public consumption
  const eventDataRaw = data?.success ? data.data : null;
  const eventData =
    eventDataRaw &&
    eventDataRaw.isPublic &&
    (eventDataRaw.status === "published" || eventDataRaw.status === "registration_open")
      ? eventDataRaw
      : null;
  const isOpenData =
    eventData?.isRegistrationOpen && (eventData?.availableSpots ?? 1) > 0;
  const supportsTeamData =
    eventData?.registrationType === "team" || eventData?.registrationType === "both";
  const supportsIndividualData =
    eventData?.registrationType === "individual" ||
    eventData?.registrationType === "both";

  const [mode, setMode] = useState<"team" | "individual">(
    supportsIndividualData ? "individual" : "team",
  );
  const [teamId, setTeamId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [division, setDivision] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const teamsQuery = useQuery({
    queryKey: ["userTeams", "forEvent"],
    queryFn: async () => getUserTeams({ data: {} }),
    enabled: isAuthenticated && !!supportsTeamData,
  });

  const divisionOptions = useMemo(() => {
    const divs = (
      eventData?.divisions as unknown as { divisions?: { name: string }[] } | undefined
    )?.divisions;
    return Array.isArray(divs) ? divs.map((d) => d.name).filter(Boolean) : [];
  }, [eventData]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 pb-28 lg:pb-16">
        {!eventData ? (
          <div className="text-center">
            <h1 className="font-heading mb-8 text-4xl">Event Not Found</h1>
            <p className="text-muted-foreground">
              This event does not exist or has been removed.
            </p>
            <Link to="/events" className="text-primary mt-4 inline-block hover:underline">
              Back to events
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading mb-2 text-center text-4xl">{eventData.name}</h1>
            {eventData.shortDescription ? (
              <p className="text-muted-foreground mb-6 text-center">
                {eventData.shortDescription}
              </p>
            ) : null}

            <div className="bg-card text-foreground rounded-lg border p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-semibold">Dates</p>
                  <p>
                    {new Date(eventData.startDate).toLocaleDateString()} —{" "}
                    {new Date(eventData.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Type</p>
                  <p className="capitalize">{eventData.type}</p>
                </div>
                <div>
                  <p className="font-semibold">Registration</p>
                  <p>{eventData.isRegistrationOpen ? "Open" : "Closed"}</p>
                </div>
                <div>
                  <p className="font-semibold">Available Spots</p>
                  <p>
                    {typeof eventData.availableSpots === "number"
                      ? eventData.availableSpots
                      : "TBD"}
                  </p>
                </div>
              </div>
              {eventData.description ? (
                <div className="mt-6">
                  <p className="font-semibold">About</p>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">
                    {eventData.description}
                  </p>
                </div>
              ) : null}
            </div>

            {isOpenData ? (
              <StickyActionBar>
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                  <div className="text-sm">
                    {eventData.registrationType === "team"
                      ? `Team Fee: $${((eventData.teamRegistrationFee || 0) / 100).toFixed(2)}`
                      : `Individual Fee: $${((eventData.individualRegistrationFee || 0) / 100).toFixed(2)}`}
                    {typeof eventData.availableSpots === "number"
                      ? ` • ${eventData.availableSpots} spots left`
                      : ""}
                  </div>
                  {!isAuthenticated ? (
                    <Button
                      onClick={() =>
                        navigate({
                          to: "/auth/login",
                          search: { redirect: `/event/${eventId}` },
                        })
                      }
                    >
                      Sign in to Register
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {eventData.registrationType === "both" ? (
                        <div className="hidden items-center gap-2 sm:flex">
                          <label className="text-sm">Mode:</label>
                          <select
                            className="rounded border px-2 py-1 text-sm"
                            value={mode}
                            onChange={(e) =>
                              setMode(e.target.value as "team" | "individual")
                            }
                          >
                            <option value="individual">Individual</option>
                            <option value="team">Team</option>
                          </select>
                        </div>
                      ) : null}
                      <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button
                            disabled={
                              registerMutation.isPending ||
                              (supportsTeamData &&
                                mode === "team" &&
                                !teamsQuery.data?.length)
                            }
                          >
                            Register
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Register for {eventData.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {eventData.registrationType === "both" ? (
                              <div className="space-y-1">
                                <label className="text-sm">Mode</label>
                                <select
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  value={mode}
                                  onChange={(e) =>
                                    setMode(e.target.value as "team" | "individual")
                                  }
                                >
                                  <option value="individual">Individual</option>
                                  <option value="team">Team</option>
                                </select>
                              </div>
                            ) : null}

                            {supportsTeamData && mode === "team" ? (
                              <div className="space-y-1">
                                <label className="text-sm">Team</label>
                                <select
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  value={teamId}
                                  onChange={(e) => setTeamId(e.target.value)}
                                >
                                  <option value="">Select team…</option>
                                  {(teamsQuery.data || []).map((ut) => (
                                    <option key={ut.team.id} value={ut.team.id}>
                                      {ut.team.name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-muted-foreground text-xs">
                                  Only captains/coaches can register a team.
                                </p>
                              </div>
                            ) : null}

                            {divisionOptions.length > 0 ? (
                              <div className="space-y-1">
                                <label className="text-sm">Division</label>
                                <select
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  value={division}
                                  onChange={(e) => setDivision(e.target.value)}
                                >
                                  <option value="">Select division…</option>
                                  {divisionOptions.map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}

                            <div className="space-y-1">
                              <label className="text-sm">Notes (optional)</label>
                              <textarea
                                className="w-full rounded border px-2 py-1 text-sm"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special requirements or info for organizers"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() =>
                                  registerMutation.mutate(
                                    {
                                      data: {
                                        eventId,
                                        teamId:
                                          supportsTeamData && mode === "team"
                                            ? teamId || undefined
                                            : undefined,
                                        division: division || undefined,
                                        notes: notes || undefined,
                                      },
                                    },
                                    {
                                      onSuccess: (res) => {
                                        if (res.success) setOpen(false);
                                      },
                                    },
                                  )
                                }
                                disabled={
                                  registerMutation.isPending ||
                                  (supportsTeamData && mode === "team" && !teamId)
                                }
                              >
                                {registerMutation.isPending
                                  ? "Submitting..."
                                  : "Submit Registration"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </StickyActionBar>
            ) : null}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
