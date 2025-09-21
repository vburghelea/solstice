import type { CheckedState } from "@radix-ui/react-checkbox";
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
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { registerForEvent } from "~/features/events/events.mutations";
import { checkEventRegistration, getEvent } from "~/features/events/events.queries";
import type {
  EventOperationResult,
  EventRegistrationResultPayload,
  EventWithDetails,
} from "~/features/events/events.types";
import { getUserTeams } from "~/features/teams/teams.queries";
import type { User } from "~/lib/auth/types";
import { callServerFn, unwrapServerFnResult } from "~/lib/server/fn-utils";

type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

type UserTeamEntry = {
  team: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    role: string | null;
  } | null;
  memberCount: number;
};

export const Route = createFileRoute("/events/$slug/register")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: EventRegistrationPage,
});

function EventRegistrationPage() {
  const { slug } = Route.useParams();
  const { user } = useRouteContext({ from: "/events/$slug/register" });
  const navigate = useNavigate();
  const [registrationType, setRegistrationType] = useState<"team" | "individual">(
    "individual",
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"square" | "etransfer">("square");
  const [confirmation, setConfirmation] = useState<
    EventRegistrationResultPayload["payment"] | null
  >(null);

  const { data: eventResult, isLoading: eventLoading } = useQuery<
    EventOperationResult<EventWithDetails>,
    Error
  >({
    queryKey: ["event", slug],
    queryFn: () => callServerFn(getEvent, { slug }),
  });

  const eventData = eventResult?.success ? eventResult.data : null;

  const { data: registrationStatus } = useQuery<
    { isRegistered: boolean } | undefined,
    Error
  >({
    queryKey: ["event-registration", eventData?.id, user?.id],
    queryFn: () =>
      callServerFn(checkEventRegistration, {
        eventId: eventData!.id,
        userId: user?.id,
      }),
    enabled: Boolean(eventData?.id && user?.id),
  });

  const { data: userProfile } = useQuery<User | null, Error>({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(),
    enabled: Boolean(user?.id),
  });

  const { data: userTeams } = useQuery<UserTeamEntry[] | undefined, Error>({
    queryKey: ["user-teams", user?.id],
    queryFn: () => callServerFn(getUserTeams, { includeInactive: false }),
    enabled: Boolean(user?.id && registrationType === "team"),
  });

  const registrationMutation = useMutation<
    EventOperationResult<EventRegistrationResultPayload>,
    Error,
    {
      eventId: string;
      teamId?: string;
      division?: string;
      notes?: string;
      roster?: { emergencyContact?: EmergencyContact };
      paymentMethod: "square" | "etransfer";
    }
  >({
    mutationFn: (payload) =>
      unwrapServerFnResult(callServerFn(registerForEvent, payload)),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.errors?.[0]?.message || "Registration failed");
        return;
      }

      const payment = result.data.payment;

      if (payment?.method === "square") {
        toast.success("Redirecting to Square checkout...");
        window.location.assign(payment.checkoutUrl);
        return;
      }

      if (payment?.method === "etransfer") {
        setConfirmation(payment);
        toast.success(
          "Registration submitted! Follow the e-transfer instructions below.",
        );
        return;
      }

      toast.success("Registration completed!");
      navigate({ to: "/dashboard/events" });
    },
    onError: (error) => {
      toast.error("An error occurred during registration");
      console.error(error);
    },
  });

  const fee = useMemo(() => {
    if (!eventData) {
      return {
        original: 0,
        discounted: 0,
        hasDiscount: false,
        discountPercentage: 0,
      };
    }

    const baseFeeCents =
      registrationType === "team"
        ? (eventData.teamRegistrationFee ?? 0)
        : (eventData.individualRegistrationFee ?? 0);

    const baseFee = baseFeeCents / 100;

    if (eventData.earlyBirdDiscount && eventData.earlyBirdDeadline) {
      const deadline = new Date(eventData.earlyBirdDeadline);
      if (new Date() < deadline) {
        const discountAmount = baseFee * (eventData.earlyBirdDiscount / 100);
        return {
          original: baseFee,
          discounted: baseFee - discountAmount,
          hasDiscount: true,
          discountPercentage: eventData.earlyBirdDiscount,
        };
      }
    }

    return {
      original: baseFee,
      discounted: baseFee,
      hasDiscount: false,
      discountPercentage: 0,
    };
  }, [eventData, registrationType]);

  const requiresPayment = fee.discounted > 0;

  if (eventLoading) {
    return <RegistrationSkeleton />;
  }

  if (!eventData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Event Not Found</AlertTitle>
          <AlertDescription>
            The event you're trying to register for doesn't exist.
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
  const effectivePaymentMethod =
    event.allowEtransfer && requiresPayment ? paymentMethod : "square";
  const submitDisabled =
    registrationMutation.isPending || confirmation?.method === "etransfer";

  const handleSubmit = () => {
    if (confirmation?.method === "etransfer") {
      toast.info("You've already submitted this registration.");
      return;
    }

    if (!termsAccepted || !waiverAccepted) {
      toast.error("Please accept all terms and conditions");
      return;
    }

    if (registrationType === "team" && !selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    const payload: {
      eventId: string;
      teamId?: string;
      notes?: string;
      roster?: { emergencyContact?: EmergencyContact };
      paymentMethod: "square" | "etransfer";
    } = {
      eventId: event.id,
      paymentMethod: effectivePaymentMethod,
    };

    if (registrationType === "team" && selectedTeamId) {
      payload.teamId = selectedTeamId;
    }

    if (additionalInfo.trim().length > 0) {
      payload.notes = additionalInfo.trim();
    }

    if (emergencyContact.name.trim().length > 0) {
      payload.roster = { emergencyContact };
    }

    setConfirmation(null);
    registrationMutation.mutate(payload);
  };

  if (registrationStatus?.isRegistered) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>Already Registered</AlertTitle>
          <AlertDescription>You are already registered for this event.</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link to="/events/$slug" params={{ slug }}>
              View Event Details
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/events/$slug" params={{ slug }}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Event Details
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Register for {event.name}</CardTitle>
              <CardDescription>
                Complete the form below to register for this event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(event.registrationType === "individual" ||
                event.registrationType === "team" ||
                event.registrationType === "both") && (
                <div className="space-y-3">
                  <Label>Registration Type</Label>
                  <RadioGroup
                    value={registrationType}
                    onValueChange={(value) =>
                      setRegistrationType(value as "team" | "individual")
                    }
                    disabled={event.registrationType !== "both"}
                  >
                    {(event.registrationType === "individual" ||
                      event.registrationType === "both") && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="individual"
                            className="cursor-pointer font-normal"
                          >
                            Individual Registration
                            <span className="text-muted-foreground ml-2 text-sm">
                              ${fee.discounted.toFixed(2)}
                              {fee.hasDiscount && (
                                <span className="ml-1 line-through">
                                  ${fee.original.toFixed(2)}
                                </span>
                              )}
                            </span>
                          </Label>
                          <p className="text-muted-foreground text-sm">
                            Register as an individual player
                          </p>
                        </div>
                      </div>
                    )}

                    {(event.registrationType === "team" ||
                      event.registrationType === "both") && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="team" id="team" />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="team" className="cursor-pointer font-normal">
                            Team Registration
                            <span className="text-muted-foreground ml-2 text-sm">
                              ${((event.teamRegistrationFee ?? 0) / 100).toFixed(2)}
                            </span>
                          </Label>
                          <p className="text-muted-foreground text-sm">
                            Register your entire team
                          </p>
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}

              {registrationType === "team" && (
                <div className="space-y-3">
                  <Label>Select Team</Label>
                  {userTeams && userTeams.length > 0 ? (
                    <Select
                      value={selectedTeamId}
                      onValueChange={(value) => setSelectedTeamId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select a team</SelectItem>
                        {userTeams.map((entry) => (
                          <SelectItem key={entry.team.id} value={entry.team.id}>
                            {entry.team.name}
                            {entry.membership?.role ? ` (${entry.membership.role})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        You need to be part of a team to register as a team. {""}
                        <Link to="/dashboard/teams" className="underline">
                          Join or create a team
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Emergency Contact</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-name">Name</Label>
                    <Input
                      id="emergency-name"
                      value={emergencyContact.name}
                      onChange={(event) =>
                        setEmergencyContact((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency-phone">Phone</Label>
                    <Input
                      id="emergency-phone"
                      value={emergencyContact.phone}
                      onChange={(event) =>
                        setEmergencyContact((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency-relationship">Relationship</Label>
                    <Input
                      id="emergency-relationship"
                      value={emergencyContact.relationship}
                      onChange={(event) =>
                        setEmergencyContact((prev) => ({
                          ...prev,
                          relationship: event.target.value,
                        }))
                      }
                      placeholder="Parent, spouse, etc."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="additional-info">Additional Information (optional)</Label>
                <Textarea
                  id="additional-info"
                  className="min-h-[100px]"
                  placeholder="Any dietary restrictions, accessibility needs, or other information..."
                  value={additionalInfo}
                  onChange={(event) => setAdditionalInfo(event.target.value)}
                />
              </div>

              <Separator />

              {requiresPayment ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Payment Method</h3>
                  <RadioGroup
                    value={effectivePaymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(value as "square" | "etransfer")
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="square" id="payment-square" />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="payment-square"
                          className="cursor-pointer font-normal"
                        >
                          Square Checkout
                          <span className="text-muted-foreground ml-2 text-sm">
                            ${fee.discounted.toFixed(2)}
                          </span>
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          Pay securely online with credit or debit card.
                        </p>
                      </div>
                    </div>

                    {event.allowEtransfer && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="etransfer" id="payment-etransfer" />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="payment-etransfer"
                            className="cursor-pointer font-normal"
                          >
                            Interac e-Transfer
                            <span className="text-muted-foreground ml-2 text-sm">
                              ${fee.discounted.toFixed(2)}
                            </span>
                          </Label>
                          <p className="text-muted-foreground text-sm">
                            Submit now and send payment manually after this form.
                          </p>
                        </div>
                      </div>
                    )}
                  </RadioGroup>

                  {effectivePaymentMethod === "etransfer" && event.allowEtransfer && (
                    <Alert>
                      <AlertTitle>E-transfer Instructions</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>
                          Send payment to
                          <span className="font-semibold">
                            {" "}
                            {event.etransferRecipient ?? "the designated email"}
                          </span>
                          . Include your name and the event in the message.
                        </p>
                        {event.etransferInstructions && (
                          <p>{event.etransferInstructions}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Payment Required</AlertTitle>
                  <AlertDescription>
                    This registration does not require payment. Submit the form to finish.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Terms and Conditions</h3>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked: CheckedState) =>
                      setTermsAccepted(Boolean(checked))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="cursor-pointer font-normal">
                      I agree to the event terms and code of conduct
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      You must agree to these terms to participate in the event.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="waiver"
                    checked={waiverAccepted}
                    onCheckedChange={(checked: CheckedState) =>
                      setWaiverAccepted(Boolean(checked))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="waiver" className="cursor-pointer font-normal">
                      I have read and accepted the liability waiver
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Every participant must accept the waiver before registering.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitDisabled}>
                  {registrationMutation.isPending
                    ? "Submitting..."
                    : confirmation?.method === "etransfer"
                      ? "Awaiting E-Transfer"
                      : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          {confirmation?.method === "etransfer" && (
            <Card>
              <CardHeader>
                <CardTitle>Finish Your E-transfer</CardTitle>
                <CardDescription>
                  Send your payment to finalize the registration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Recipient Email</p>
                  <p className="text-muted-foreground">
                    {event.etransferRecipient ?? "See event instructions"}
                  </p>
                </div>
                {event.etransferInstructions && (
                  <div>
                    <p className="font-medium">Instructions</p>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {event.etransferInstructions}
                    </p>
                  </div>
                )}
                <Alert>
                  <AlertDescription>
                    Once the payment is received, an administrator will mark your
                    registration as paid.
                  </AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                  <Link to="/dashboard/events">Return to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-muted-foreground h-4 w-4" />
                  <span>
                    {format(new Date(event.startDate), "MMM d, yyyy")}
                    {event.endDate !== event.startDate &&
                      ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                  </span>
                </div>

                {event.city && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="text-muted-foreground h-4 w-4" />
                    <span>
                      {event.city}
                      {event.province && `, ${event.province}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <UsersIcon className="text-muted-foreground h-4 w-4" />
                  <span className="capitalize">
                    {event.registrationType} registration
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={event.isRegistrationOpen ? "outline" : "secondary"}>
                    {event.isRegistrationOpen
                      ? "Registration open"
                      : "Registration closed"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Registered</span>
                  <span>{event.registrationCount}</span>
                </div>

                {event.availableSpots !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>Spots remaining</span>
                    <span>{event.availableSpots}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Registration Fees</h4>
                <div className="flex items-center justify-between">
                  <span>Current Fee</span>
                  <span className="font-semibold">${fee.discounted.toFixed(2)}</span>
                </div>
                {fee.hasDiscount && (
                  <p className="text-muted-foreground text-sm">
                    Early bird discount applied ({fee.discountPercentage}% off)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                {userProfile?.name ?? userProfile?.email ?? "Unknown participant"}
              </div>
              <div className="text-muted-foreground">
                {userProfile?.email ?? user?.email ?? "No email available"}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function RegistrationSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Skeleton className="h-6 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
