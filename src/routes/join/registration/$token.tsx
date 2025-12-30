import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircleIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
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
import { Skeleton } from "~/components/ui/skeleton";
import {
  acceptRegistrationInvite,
  declineRegistrationInvite,
} from "~/features/events/registration-groups.mutations";
import { getRegistrationInvitePreview } from "~/features/events/registration-groups.queries";
import type { RegistrationInviteRedemptionResult } from "~/features/events/registration-groups.types";
import { callServerFn } from "~/lib/server/fn-utils";

export const Route = createFileRoute("/join/registration/$token")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: RegistrationInvitePage,
});

const groupTypeLabels: Record<string, string> = {
  individual: "Individual Registration",
  pair: "Pair Registration",
  relay: "Relay Team",
  team: "Team Registration",
};

function RegistrationInvitePage() {
  const { token } = Route.useParams();
  const { user } = useRouteContext({ from: "/join/registration/$token" });
  const navigate = useNavigate();
  const [result, setResult] = useState<RegistrationInviteRedemptionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: invitePreview, isLoading: previewLoading } = useQuery({
    queryKey: ["registration-invite-preview", token],
    queryFn: () => getRegistrationInvitePreview({ data: { token } }),
    staleTime: 1000 * 60 * 5,
  });

  const acceptMutation = useMutation({
    mutationFn: () => callServerFn(acceptRegistrationInvite, { token }),
    onSuccess: (data) => {
      setResult(data);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to accept invitation",
      );
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => callServerFn(declineRegistrationInvite, { token }),
    onSuccess: () => {
      setResult({ status: "declined", groupId: "", memberId: "" });
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to decline invitation",
      );
    },
  });

  const handleBackToEvents = () => {
    navigate({ to: "/dashboard/events" });
  };

  if (previewLoading) {
    return (
      <div className="container mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInvalidOrExpired = !invitePreview?.valid || invitePreview?.expired;

  return (
    <div className="container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Registration Invitation</CardTitle>
          {invitePreview?.eventName && (
            <CardDescription>
              You've been invited to join a registration group
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details */}
          {invitePreview?.eventName && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{invitePreview.eventName}</h3>
                  {invitePreview.groupType && (
                    <Badge variant="secondary" className="mt-1">
                      {groupTypeLabels[invitePreview.groupType] ??
                        invitePreview.groupType}
                    </Badge>
                  )}
                </div>
                {invitePreview.eventId && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/dashboard/events/$slug"
                      params={{ slug: invitePreview.eventId }}
                    >
                      View Event
                    </Link>
                  </Button>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                {invitePreview.eventStartDate && (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {format(
                        new Date(invitePreview.eventStartDate),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </span>
                  </div>
                )}
                {invitePreview.invitedByName && (
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    <span>Invited by {invitePreview.invitedByName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personalized greeting */}
          <p className="text-muted-foreground text-sm">
            Hi {user?.name ?? user?.email ?? "there"},{" "}
            {isInvalidOrExpired
              ? "this invitation is no longer valid."
              : "confirm whether you want to join this registration group."}
          </p>

          {/* Invalid/Expired state */}
          {isInvalidOrExpired && !result && (
            <Alert variant="destructive">
              <XCircleIcon className="h-4 w-4" />
              <AlertTitle>
                {invitePreview?.expired ? "Invitation Expired" : "Invalid Invitation"}
              </AlertTitle>
              <AlertDescription>
                {invitePreview?.expired
                  ? "This invitation has expired. Please ask the group organizer to send a new invite."
                  : "This invitation link is invalid or has already been used."}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && !isInvalidOrExpired ? (
            <Alert variant="destructive">
              <XCircleIcon className="h-4 w-4" />
              <AlertTitle>Invitation Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {result?.status === "joined" || result?.status === "already_member" ? (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>You're in!</AlertTitle>
              <AlertDescription>
                You have joined the registration group
                {invitePreview?.eventName ? ` for ${invitePreview.eventName}` : ""}. You
                can view your upcoming events from the dashboard.
              </AlertDescription>
            </Alert>
          ) : null}

          {result?.status === "declined" ? (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>Invitation Declined</AlertTitle>
              <AlertDescription>
                You have declined this registration invite.
              </AlertDescription>
            </Alert>
          ) : null}

          {!result && !isInvalidOrExpired ? (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                {acceptMutation.isPending ? "Accepting..." : "Accept invitation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => declineMutation.mutate()}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                {declineMutation.isPending ? "Declining..." : "Decline"}
              </Button>
            </div>
          ) : null}

          <Button variant="ghost" onClick={handleBackToEvents}>
            Back to events
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
