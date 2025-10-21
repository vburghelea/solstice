import type { CheckedState } from "@radix-ui/react-checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
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
import { Label } from "~/components/ui/label";
import { LocalizedButtonLink, LocalizedLink } from "~/components/ui/LocalizedLink";
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
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { getUserTeams } from "~/features/teams/teams.queries";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";
import type { User } from "~/lib/auth/types";
import { callServerFn, unwrapServerFnResult } from "~/lib/server/fn-utils";

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
  const { t } = useEventsTranslation();
  const { slug } = Route.useParams();
  const { user } = useRouteContext({ from: "/events/$slug/register" });
  const navigate = useNavigate();
  const [registrationType, setRegistrationType] = useState<"team" | "individual">(
    "individual",
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState("");
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
  const isPublicEvent =
    eventData?.isPublic &&
    ["published", "registration_open", "registration_closed", "in_progress"].includes(
      eventData.status,
    );

  const { data: registrationStatus, isLoading: registrationLoading } = useQuery<
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
      roster?: Record<string, unknown>;
      paymentMethod: "square" | "etransfer";
    }
  >({
    mutationFn: (payload) =>
      unwrapServerFnResult(callServerFn(registerForEvent, payload)),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.errors?.[0]?.message || t("registration.registration_failed"));
        return;
      }

      const payment = result.data.payment;

      if (payment?.method === "square") {
        toast.success(t("registration.redirecting_to_square"));
        window.location.assign(payment.checkoutUrl);
        return;
      }

      if (payment?.method === "etransfer") {
        setConfirmation(payment);
        toast.success(t("registration.registration_submitted"));
        return;
      }

      toast.success(t("registration.registration_completed"));
      navigate({ to: "/player/events" });
    },
    onError: (error) => {
      toast.error(t("registration.error_during_registration"));
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

  if (eventLoading || registrationLoading) {
    return (
      <VisitorShell>
        <RegistrationSkeleton />
      </VisitorShell>
    );
  }

  if (!eventData || !isPublicEvent) {
    return (
      <VisitorShell>
        <div className="container mx-auto px-4 py-16">
          <Alert variant="destructive">
            <AlertTitle>{t("registration.event_not_found")}</AlertTitle>
            <AlertDescription>{t("registration.event_not_available")}</AlertDescription>
          </Alert>
          <LocalizedButtonLink
            to="/events"
            translationKey="links.event_registration.back_to_events"
            translationNamespace="navigation"
            className="mt-6"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
          </LocalizedButtonLink>
        </div>
      </VisitorShell>
    );
  }

  const event = eventData;
  const effectivePaymentMethod =
    event.allowEtransfer && requiresPayment ? paymentMethod : "square";
  const submitDisabled =
    registrationMutation.isPending || confirmation?.method === "etransfer";

  const handleSubmit = () => {
    if (confirmation?.method === "etransfer") {
      toast.info(t("registration.already_submitted"));
      return;
    }

    if (!termsAccepted || !waiverAccepted) {
      toast.error(t("registration.accept_all_terms"));
      return;
    }

    if (registrationType === "team" && !selectedTeamId) {
      toast.error(t("registration.select_a_team"));
      return;
    }

    const payload: {
      eventId: string;
      teamId?: string;
      notes?: string;
      roster?: Record<string, unknown>;
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

    setConfirmation(null);
    registrationMutation.mutate(payload);
  };

  if (registrationStatus?.isRegistered) {
    return (
      <VisitorShell>
        <div className="container mx-auto px-4 py-16">
          <Alert>
            <CheckCircleIcon className="h-4 w-4" />
            <AlertTitle>{t("registration.already_registered")}</AlertTitle>
            <AlertDescription>
              {t("registration.already_registered_description")}
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-2">
            <LocalizedButtonLink
              to="/events/$slug"
              params={{ slug }}
              translationKey="links.event_registration.view_event_details"
              translationNamespace="navigation"
            />
            <LocalizedButtonLink
              to="/events"
              variant="outline"
              translationKey="links.event_registration.back_to_events"
              translationNamespace="navigation"
            />
          </div>
        </div>
      </VisitorShell>
    );
  }

  return (
    <VisitorShell>
      <div className="container mx-auto space-y-6 px-4 py-16">
        <div className="flex items-center gap-4">
          <LocalizedButtonLink
            to="/events/$slug"
            params={{ slug }}
            variant="ghost"
            size="sm"
            translationKey="links.event_registration.back_to_event_details"
            translationNamespace="navigation"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
          </LocalizedButtonLink>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("registration.register_for_event", { eventName: event.name })}
                </CardTitle>
                <CardDescription>
                  {t("registration.register_description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(event.registrationType === "individual" ||
                  event.registrationType === "team" ||
                  event.registrationType === "both") && (
                  <div className="space-y-3">
                    <Label>{t("registration.registration_type")}</Label>
                    <RadioGroup
                      value={registrationType}
                      onValueChange={(value: string) => {
                        if (value === "team" || value === "individual") {
                          setRegistrationType(value);
                        }
                      }}
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
                              {t("registration.individual_registration")}
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
                              {t("registration.register_as_individual")}
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
                              {t("registration.team_registration")}
                              <span className="text-muted-foreground ml-2 text-sm">
                                ${((event.teamRegistrationFee ?? 0) / 100).toFixed(2)}
                              </span>
                            </Label>
                            <p className="text-muted-foreground text-sm">
                              {t("registration.register_entire_team")}
                            </p>
                          </div>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                {registrationType === "team" && (
                  <div className="space-y-3">
                    <Label>{t("registration.select_team")}</Label>
                    {userTeams && userTeams.length > 0 ? (
                      <Select
                        value={selectedTeamId}
                        onValueChange={(value) => setSelectedTeamId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("registration.select_team_placeholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            {t("registration.select_team_placeholder")}
                          </SelectItem>
                          {userTeams.map((entry) => (
                            <SelectItem key={entry.team.id} value={entry.team.id}>
                              {entry.team.name}
                              {entry.membership?.role
                                ? ` (${entry.membership.role})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          {t("registration.need_team_to_register")} {""}
                          <LocalizedLink
                            to="/player/teams"
                            translationKey="links.event_registration.join_create_team"
                            translationNamespace="navigation"
                            className="underline"
                          />
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="additional-info">
                    {t("registration.additional_info")}
                  </Label>
                  <Textarea
                    id="additional-info"
                    className="min-h-[100px]"
                    placeholder={t("registration.additional_info_placeholder")}
                    value={additionalInfo}
                    onChange={(event) => setAdditionalInfo(event.target.value)}
                  />
                </div>

                <Separator />

                {requiresPayment ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold">{t("registration.payment_method")}</h3>
                    <RadioGroup
                      value={effectivePaymentMethod}
                      onValueChange={(value: string) => {
                        if (value === "square" || value === "etransfer") {
                          setPaymentMethod(value);
                        }
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="square" id="payment-square" />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="payment-square"
                            className="cursor-pointer font-normal"
                          >
                            {t("registration.square_checkout")}
                            <span className="text-muted-foreground ml-2 text-sm">
                              ${fee.discounted.toFixed(2)}
                            </span>
                          </Label>
                          <p className="text-muted-foreground text-sm">
                            {t("registration.pay_securely_online")}
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
                              {t("registration.etransfer")}
                              <span className="text-muted-foreground ml-2 text-sm">
                                ${fee.discounted.toFixed(2)}
                              </span>
                            </Label>
                            <p className="text-muted-foreground text-sm">
                              {t("registration.submit_send_payment_manually")}
                            </p>
                          </div>
                        </div>
                      )}
                    </RadioGroup>

                    {effectivePaymentMethod === "etransfer" && event.allowEtransfer && (
                      <Alert>
                        <AlertTitle>
                          {t("registration.etransfer_instructions")}
                        </AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>
                            {t("registration.send_payment_to", {
                              recipient:
                                event.etransferRecipient ??
                                t("registration.see_event_instructions"),
                            })}
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
                    <AlertTitle>{t("registration.no_payment_required")}</AlertTitle>
                    <AlertDescription>
                      {t("registration.no_payment_description")}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold">
                    {t("registration.terms_and_conditions")}
                  </h3>

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
                        {t("registration.agree_terms")}
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        {t("registration.agree_terms_description")}
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
                        {t("registration.accept_liability_waiver")}
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        {t("registration.accept_waiver_description")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={submitDisabled}>
                    {registrationMutation.isPending
                      ? t("registration.submitting")
                      : confirmation?.method === "etransfer"
                        ? t("registration.awaiting_etransfer")
                        : t("registration.complete_registration")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            {confirmation?.method === "etransfer" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("registration.finish_etransfer")}</CardTitle>
                  <CardDescription>
                    {t("registration.send_payment_finalize")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">{t("registration.recipient_email")}</p>
                    <p className="text-muted-foreground">
                      {event.etransferRecipient ??
                        t("registration.see_event_instructions")}
                    </p>
                  </div>
                  {event.etransferInstructions && (
                    <div>
                      <p className="font-medium">{t("registration.instructions")}</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {event.etransferInstructions}
                      </p>
                    </div>
                  )}
                  <Alert>
                    <AlertDescription>
                      {t("registration.payment_received_confirmation")}
                    </AlertDescription>
                  </Alert>
                  <LocalizedButtonLink
                    to="/player/events"
                    variant="outline"
                    translationKey="links.event_registration.return_to_dashboard"
                    translationNamespace="navigation"
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>{t("registration.event_overview")}</CardTitle>
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
                        {event.country && `, ${event.country}`}
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
                    <span>{t("registration.status")}</span>
                    <Badge variant={event.isRegistrationOpen ? "outline" : "secondary"}>
                      {event.isRegistrationOpen
                        ? t("registration.registration_open")
                        : t("registration.registration_closed")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>{t("registration.registered")}</span>
                    <span>{event.registrationCount}</span>
                  </div>

                  {event.availableSpots !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>{t("registration.spots_remaining")}</span>
                      <span>{event.availableSpots}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">{t("registration.registration_fees")}</h4>
                  <div className="flex items-center justify-between">
                    <span>{t("registration.current_fee")}</span>
                    <span className="font-semibold">${fee.discounted.toFixed(2)}</span>
                  </div>
                  {fee.hasDiscount && (
                    <p className="text-muted-foreground text-sm">
                      {t("registration.early_bird_applied", {
                        percentage: fee.discountPercentage,
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("registration.participant_information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  {userProfile?.name ??
                    userProfile?.email ??
                    t("registration.unknown_participant")}
                </div>
                <div className="text-muted-foreground">
                  {userProfile?.email ??
                    user?.email ??
                    t("registration.no_email_available")}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </VisitorShell>
  );
}

function RegistrationSkeleton() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-16">
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
