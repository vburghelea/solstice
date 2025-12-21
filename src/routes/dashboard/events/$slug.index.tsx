import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { format, isSameDay } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { checkEventRegistration, getEvent } from "~/features/events/events.queries";
import type {
  EventOperationResult,
  EventWithDetails,
} from "~/features/events/events.types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import { cn } from "~/shared/lib/utils";

export const Route = createFileRoute("/dashboard/events/$slug/")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useRouteContext({ from: "/dashboard/events/$slug" });

  const {
    data: eventResult,
    isLoading,
    error,
  } = useQuery<EventOperationResult<EventWithDetails>, Error>({
    queryKey: ["event", slug],
    queryFn: () => getEvent({ data: { slug } }),
  });

  const eventData = eventResult?.success ? eventResult.data : null;

  const { data: registrationStatus, isLoading: registrationLoading } = useQuery<
    { isRegistered: boolean } | undefined,
    Error
  >({
    // Include user.id in key for cache invalidation when user changes
    queryKey: ["event-registration", eventData?.id, user?.id],
    queryFn: () =>
      checkEventRegistration({
        data: {
          eventId: eventData!.id,
          // userId is now inferred from session on server
        },
      }),
    enabled: Boolean(eventData?.id && user?.id),
  });

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !eventData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Event Not Found</AlertTitle>
          <AlertDescription>
            The event you're looking for doesn't exist or has been removed.
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

  const event = eventData;
  const isRegistrationOpen = event.isRegistrationOpen;
  const hasSpots = event.availableSpots === undefined || event.availableSpots > 0;
  const eventStatusBadge = getEventStatusBadge(event.status);
  const registrationBadge = getRegistrationAvailabilityBadge(
    isRegistrationOpen,
    hasSpots,
  );
  const maxTeamsValue = typeof event.maxTeams === "number" ? event.maxTeams : undefined;
  const maxParticipantsValue =
    typeof event.maxParticipants === "number" ? event.maxParticipants : undefined;
  const showEarlyBirdDiscount = shouldShowEarlyBirdDiscount(event);
  const registrationClosesAtDate = event.registrationClosesAt
    ? new Date(event.registrationClosesAt)
    : null;
  const earlyBirdDeadlineDate = event.earlyBirdDeadline
    ? new Date(event.earlyBirdDeadline)
    : null;
  const registrationCapacityParts: string[] = [];
  if (maxTeamsValue !== undefined) {
    registrationCapacityParts.push(`${maxTeamsValue} teams`);
  }
  if (maxParticipantsValue !== undefined) {
    registrationCapacityParts.push(`${maxParticipantsValue} people`);
  }
  const registrationCapacitySuffix = registrationCapacityParts.length
    ? ` / ${registrationCapacityParts.join(" / ")}`
    : "";
  const canManageEvent = user
    ? user.id === event.organizer.id || isAdminClient(user)
    : false;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/events">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        {canManageEvent && (
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/events/$eventId/manage" params={{ eventId: event.id }}>
              Manage Event
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl">{event.name}</CardTitle>
                  <CardDescription>{event.shortDescription}</CardDescription>
                </div>
                <Badge
                  variant={eventStatusBadge.variant}
                  className={cn("capitalize", eventStatusBadge.className)}
                >
                  {event.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold">Event Details</h3>

                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="text-muted-foreground h-4 w-4" />
                    <span>
                      {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
                      {!isSameDay(new Date(event.startDate), new Date(event.endDate)) &&
                        ` - ${format(new Date(event.endDate), "EEEE, MMMM d, yyyy")}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="text-muted-foreground h-4 w-4" />
                    <span className="capitalize">{event.type} Event</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <UsersIcon className="text-muted-foreground h-4 w-4" />
                    <span className="capitalize">
                      {event.registrationType} Registration
                    </span>
                  </div>

                  {maxTeamsValue !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <InfoIcon className="text-muted-foreground h-4 w-4" />
                      <span>Max {maxTeamsValue} teams</span>
                    </div>
                  )}

                  {maxParticipantsValue !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <InfoIcon className="text-muted-foreground h-4 w-4" />
                      <span>Max {maxParticipantsValue} participants</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Location</h3>

                  {event.venueName && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPinIcon className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <div className="font-medium">{event.venueName}</div>
                        {event.venueAddress && <div>{event.venueAddress}</div>}
                        {event.city && (
                          <div>
                            {event.city}
                            {event.province && `, ${event.province}`}
                            {event.postalCode && ` ${event.postalCode}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {event.locationNotes && (
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <p className="mb-1 font-medium">Location Notes:</p>
                      <p>{event.locationNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          {event.schedule && Object.keys(event.schedule).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(event.schedule).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between border-b py-2 last:border-0"
                    >
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {event.rules && Object.keys(event.rules).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rules & Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(event.rules).map(([key, value]) => (
                    <div key={key} className="py-2">
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>{" "}
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {event.requirements && Object.keys(event.requirements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(event.requirements).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="capitalize">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {event.amenities && Object.keys(event.amenities).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(event.amenities).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={registrationBadge.variant}
                    className={cn("capitalize", registrationBadge.className)}
                  >
                    {isRegistrationOpen ? "Open" : "Closed"}
                  </Badge>
                </div>

                {registrationClosesAtDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Closes</span>
                    <span className="text-muted-foreground text-sm">
                      {format(registrationClosesAtDate, "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Registered</span>
                  <span className="text-sm">
                    {event.registrationCount}
                    {registrationCapacitySuffix}
                  </span>
                </div>

                {event.availableSpots !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Spots</span>
                    <span
                      className={`text-sm font-bold ${
                        event.availableSpots > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {event.availableSpots}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <h4 className="font-medium">Registration Fees</h4>

                {event.registrationType === "team" ||
                event.registrationType === "both" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team Registration</span>
                    <span className="font-medium">
                      ${((event.teamRegistrationFee || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {event.registrationType === "individual" ||
                event.registrationType === "both" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Individual Registration</span>
                    <span className="font-medium">
                      ${((event.individualRegistrationFee || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {showEarlyBirdDiscount && earlyBirdDeadlineDate && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      {event.earlyBirdDiscount}% early bird discount available until{" "}
                      {format(earlyBirdDeadlineDate, "MMM d")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              {user && registrationLoading ? (
                <div className="w-full">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : registrationStatus?.isRegistered ? (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertTitle>You're Registered!</AlertTitle>
                  <AlertDescription>
                    You are already registered for this event.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {isRegistrationOpen && hasSpots ? (
                    <Button asChild className="w-full">
                      <Link
                        to="/dashboard/events/$slug/register"
                        params={{ slug: event.slug }}
                      >
                        Register Now
                      </Link>
                    </Button>
                  ) : !isRegistrationOpen ? (
                    <Button disabled className="w-full">
                      Registration Closed
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Event Full
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Organizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <UserIcon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{event.organizer.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {event.contactEmail || event.organizer.email}
                  </div>
                </div>
              </div>

              {event.contactPhone && (
                <div className="text-sm">
                  <span className="font-medium">Phone:</span> {event.contactPhone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card>
            <CardHeader>
              <CardTitle>Share Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  } catch {
                    toast.error("Failed to copy link");
                  }
                }}
              >
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Skeleton className="h-8 w-32" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
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

function getRegistrationAvailabilityBadge(
  isOpen: boolean,
  hasSpots: boolean,
): { variant: "default" | "secondary" | "destructive" | "outline"; className?: string } {
  if (!isOpen) {
    return { variant: "secondary" };
  }

  if (!hasSpots) {
    return {
      variant: "outline",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    variant: "outline",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function shouldShowEarlyBirdDiscount(event: EventWithDetails): boolean {
  if (!event.earlyBirdDiscount || !event.earlyBirdDeadline) {
    return false;
  }

  return new Date(event.earlyBirdDeadline) > new Date();
}
