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
  UserPlusIcon,
  UsersIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { registerForEvent } from "~/features/events/events.mutations";
import { checkEventRegistration, getEvent } from "~/features/events/events.queries";
import type {
  EventOperationResult,
  EventRegistrationResultPayload,
  EventWithDetails,
} from "~/features/events/events.types";
import {
  getUserMembershipStatus,
  listMembershipTypes,
} from "~/features/membership/membership.queries";
import { getUserTeams } from "~/features/teams/teams.queries";
import { callServerFn, unwrapServerFnResult } from "~/lib/server/fn-utils";
import { createPageHead } from "~/shared/lib/page-head";

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

type RegistrationGroupType = "individual" | "pair" | "relay" | "team" | "family";
type RegistrationInviteRole = "member" | "captain";
type RegistrationInviteStatus = "pending" | "invited";

type RegistrationInviteDraft = {
  id: string;
  email: string;
  role: RegistrationInviteRole;
  status: RegistrationInviteStatus;
  addedAt: string;
};

type PendingCheckout = {
  sessionId: string;
  checkoutUrl: string;
  createdAt: string;
  totalAmount: number;
};

const groupTypeOptions: Array<{
  value: RegistrationGroupType;
  label: string;
  description: string;
  registrationType: "team" | "individual";
}> = [
  {
    value: "individual",
    label: "Individual",
    description: "Single participant registration",
    registrationType: "individual",
  },
  {
    value: "pair",
    label: "Pair",
    description: "Two-person entry with shared checkout",
    registrationType: "individual",
  },
  {
    value: "relay",
    label: "Relay",
    description: "Multi-leg group with shared checkout",
    registrationType: "team",
  },
  {
    value: "team",
    label: "Team",
    description: "Full team roster with a captain",
    registrationType: "team",
  },
  {
    value: "family",
    label: "Family",
    description: "Household group registration",
    registrationType: "individual",
  },
];

const groupRoleOptions: Array<{ value: RegistrationInviteRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "captain", label: "Captain" },
];

const isValidInviteEmail = (email: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

export const Route = createFileRoute("/dashboard/events/$slug/register")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }
  },
  head: () => createPageHead("Event Registration"),
  component: EventRegistrationPage,
});

function EventRegistrationPage() {
  const { slug } = Route.useParams();
  const { user } = useRouteContext({ from: "/dashboard/events/$slug/register" });
  const navigate = useNavigate();
  const groupDraftStorageKey = `event:${slug}:group-registration-draft`;
  const pendingCheckoutStorageKey = `event:${slug}:pending-checkout`;

  const [groupType, setGroupType] = useState<RegistrationGroupType>(() => {
    if (typeof window === "undefined") return "individual";
    const stored = localStorage.getItem(groupDraftStorageKey);
    if (!stored) return "individual";
    try {
      const parsed = JSON.parse(stored) as { groupType?: RegistrationGroupType };
      return parsed.groupType ?? "individual";
    } catch {
      return "individual";
    }
  });
  const [inviteDrafts, setInviteDrafts] = useState<RegistrationInviteDraft[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(groupDraftStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as {
        invites?: RegistrationInviteDraft[];
      };
      return parsed.invites ?? [];
    } catch {
      return [];
    }
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RegistrationInviteRole>("member");
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(pendingCheckoutStorageKey);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as PendingCheckout;
      if (!parsed?.checkoutUrl || !parsed?.sessionId) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string>("__select__");
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
  const [membershipTypeId, setMembershipTypeId] = useState<string>("");

  const { data: eventResult, isLoading: eventLoading } = useQuery<
    EventOperationResult<EventWithDetails>,
    Error
  >({
    queryKey: ["event", slug],
    queryFn: () => callServerFn(getEvent, { slug }),
  });

  const eventData = eventResult?.success ? eventResult.data : null;

  const groupTypeOptionsForEvent = useMemo(() => {
    if (!eventData) return groupTypeOptions;
    if (eventData.registrationType === "team") {
      return groupTypeOptions.filter((option) => option.registrationType === "team");
    }
    if (eventData.registrationType === "individual") {
      return groupTypeOptions.filter(
        (option) => option.registrationType === "individual",
      );
    }
    return groupTypeOptions;
  }, [eventData]);

  const resolvedGroupType = useMemo(() => {
    const allowedValues = new Set(groupTypeOptionsForEvent.map((option) => option.value));
    if (allowedValues.has(groupType)) return groupType;
    return groupTypeOptionsForEvent[0]?.value ?? "individual";
  }, [groupType, groupTypeOptionsForEvent]);

  // Compute effective registration type based on event's allowed types
  // This prevents wrong fee calculation for team-only or individual-only events
  const effectiveRegistrationType = useMemo(() => {
    const selectedOption = groupTypeOptions.find(
      (option) => option.value === resolvedGroupType,
    );
    const baseType = selectedOption?.registrationType ?? "individual";
    if (!eventData) return baseType;
    if (eventData.registrationType === "team") return "team";
    if (eventData.registrationType === "individual") return "individual";
    return baseType; // "both" - user choice
  }, [eventData, resolvedGroupType]);

  const { data: registrationStatus, isLoading: registrationLoading } = useQuery<
    { isRegistered: boolean } | undefined,
    Error
  >({
    // Include user.id in key for cache invalidation when user changes
    queryKey: ["event-registration", eventData?.id, user?.id],
    queryFn: () =>
      callServerFn(checkEventRegistration, {
        eventId: eventData!.id,
        // userId is now inferred from session on server
      }),
    enabled: Boolean(eventData?.id && user?.id),
  });

  useEffect(() => {
    if (!registrationStatus?.isRegistered) return;
    localStorage.removeItem(pendingCheckoutStorageKey);
    localStorage.removeItem(groupDraftStorageKey);
  }, [registrationStatus, pendingCheckoutStorageKey, groupDraftStorageKey]);

  const userProfile = user;

  const { data: membershipStatusResult } = useQuery({
    queryKey: ["membership-status", user?.id],
    queryFn: () => callServerFn(getUserMembershipStatus, undefined),
    enabled: Boolean(user?.id),
  });

  const hasActiveMembership = Boolean(
    membershipStatusResult?.success && membershipStatusResult.data?.hasMembership,
  );

  const { data: membershipTypesResult } = useQuery({
    queryKey: ["membership-types"],
    queryFn: () => callServerFn(listMembershipTypes, undefined),
    enabled: Boolean(eventData?.requireMembership && !hasActiveMembership),
  });

  const membershipTypes = useMemo(() => {
    if (membershipTypesResult?.success && membershipTypesResult.data) {
      return membershipTypesResult.data;
    }
    return [];
  }, [membershipTypesResult]);

  const selectedMembershipType = membershipTypes.find(
    (type) => type.id === membershipTypeId,
  );

  const membershipFee = selectedMembershipType
    ? selectedMembershipType.priceCents / 100
    : 0;

  const requiresMembershipSelection = Boolean(
    eventData?.requireMembership && !hasActiveMembership,
  );

  const resolvedMembershipTypeId = membershipTypeId || membershipTypes[0]?.id || "";

  const { data: userTeams } = useQuery<UserTeamEntry[] | undefined, Error>({
    queryKey: ["user-teams", user?.id],
    queryFn: () => callServerFn(getUserTeams, { includeInactive: false }),
    enabled: Boolean(user?.id && effectiveRegistrationType === "team"),
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
      membershipTypeId?: string;
      groupType?: RegistrationGroupType;
      invites?: Array<{ email: string; role?: RegistrationInviteRole }>;
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
        if (pendingCheckoutStorageKey) {
          const draft: PendingCheckout = {
            sessionId: payment.sessionId,
            checkoutUrl: payment.checkoutUrl,
            createdAt: new Date().toISOString(),
            totalAmount: totalFee,
          };
          localStorage.setItem(pendingCheckoutStorageKey, JSON.stringify(draft));
          setPendingCheckout(draft);
        }
        toast.success("Redirecting to Square checkout...");
        window.location.assign(payment.checkoutUrl);
        return;
      }

      if (payment?.method === "etransfer") {
        setConfirmation(payment);
        toast.success(
          "Registration submitted! Follow the e-transfer instructions below.",
        );
        if (pendingCheckoutStorageKey) {
          localStorage.removeItem(pendingCheckoutStorageKey);
          setPendingCheckout(null);
        }
        localStorage.removeItem(groupDraftStorageKey);
        return;
      }

      if (pendingCheckoutStorageKey) {
        localStorage.removeItem(pendingCheckoutStorageKey);
        setPendingCheckout(null);
      }
      localStorage.removeItem(groupDraftStorageKey);
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

    // Use effectiveRegistrationType to calculate correct fee for team-only/individual-only events
    const baseFeeCents =
      effectiveRegistrationType === "team"
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
  }, [eventData, effectiveRegistrationType]);

  const totalFee = fee.discounted + (requiresMembershipSelection ? membershipFee : 0);
  const requiresPayment = totalFee > 0;

  useEffect(() => {
    const draftPayload = JSON.stringify({
      groupType: resolvedGroupType,
      invites: inviteDrafts,
    });
    localStorage.setItem(groupDraftStorageKey, draftPayload);
  }, [groupDraftStorageKey, resolvedGroupType, inviteDrafts]);

  if (eventLoading || registrationLoading) {
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
    event.allowEtransfer && requiresPayment && !requiresMembershipSelection
      ? paymentMethod
      : "square";
  const visiblePendingCheckout = registrationStatus?.isRegistered
    ? null
    : pendingCheckout;
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

    if (
      effectiveRegistrationType === "team" &&
      (!selectedTeamId || selectedTeamId === "__select__")
    ) {
      toast.error("Please select a team");
      return;
    }

    if (requiresMembershipSelection && !resolvedMembershipTypeId) {
      toast.error("Please select a membership option");
      return;
    }

    const payload: {
      eventId: string;
      teamId?: string;
      notes?: string;
      roster?: { emergencyContact?: EmergencyContact };
      paymentMethod: "square" | "etransfer";
      membershipTypeId?: string;
      groupType?: RegistrationGroupType;
      invites?: Array<{ email: string; role?: RegistrationInviteRole }>;
    } = {
      eventId: event.id,
      paymentMethod: effectivePaymentMethod,
    };

    if (
      effectiveRegistrationType === "team" &&
      selectedTeamId &&
      selectedTeamId !== "__select__"
    ) {
      payload.teamId = selectedTeamId;
    }

    if (additionalInfo.trim().length > 0) {
      payload.notes = additionalInfo.trim();
    }

    if (emergencyContact.name.trim().length > 0) {
      payload.roster = { emergencyContact };
    }

    if (requiresMembershipSelection && resolvedMembershipTypeId) {
      payload.membershipTypeId = resolvedMembershipTypeId;
    }

    if (resolvedGroupType && resolvedGroupType !== "individual") {
      payload.groupType = resolvedGroupType;
      payload.invites = inviteDrafts.map((invite) => ({
        email: invite.email,
        role: invite.role,
      }));
    }

    setConfirmation(null);
    registrationMutation.mutate(payload);
  };

  const handleAddInvite = () => {
    const trimmedEmail = inviteEmail.trim().toLowerCase();
    if (!isValidInviteEmail(trimmedEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (inviteDrafts.some((invite) => invite.email === trimmedEmail)) {
      toast.error("That email is already invited");
      return;
    }

    const newInvite: RegistrationInviteDraft = {
      id: `invite-${Date.now()}`,
      email: trimmedEmail,
      role: inviteRole,
      status: "pending",
      addedAt: new Date().toISOString(),
    };

    setInviteDrafts((prev) => [...prev, newInvite]);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleRemoveInvite = (id: string) => {
    setInviteDrafts((prev) => prev.filter((invite) => invite.id !== id));
  };

  const handleResumeCheckout = () => {
    if (!pendingCheckout?.checkoutUrl) return;
    window.location.assign(pendingCheckout.checkoutUrl);
  };

  const handleClearPendingCheckout = () => {
    if (pendingCheckoutStorageKey) {
      localStorage.removeItem(pendingCheckoutStorageKey);
    }
    setPendingCheckout(null);
    toast.message("Cleared pending checkout");
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
            <Link to="/dashboard/events/$slug" params={{ slug }}>
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
          <Link to="/dashboard/events/$slug" params={{ slug }}>
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
              <div className="space-y-3">
                <Label>Group Type</Label>
                <RadioGroup
                  value={resolvedGroupType}
                  onValueChange={(value) => setGroupType(value as RegistrationGroupType)}
                  className="grid gap-3"
                  disabled={groupTypeOptionsForEvent.length === 1}
                >
                  {groupTypeOptionsForEvent.map((option) => (
                    <div key={option.value} className="flex items-start space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={option.value}
                          className="cursor-pointer font-normal"
                        >
                          {option.label}
                          <span className="text-muted-foreground ml-2 text-sm">
                            {option.registrationType === "team"
                              ? `$${((event.teamRegistrationFee ?? 0) / 100).toFixed(2)}`
                              : `$${fee.discounted.toFixed(2)}`}
                            {option.registrationType === "individual" &&
                              fee.hasDiscount && (
                                <span className="ml-1 line-through">
                                  ${fee.original.toFixed(2)}
                                </span>
                              )}
                          </span>
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
                {event.registrationType !== "both" && (
                  <p className="text-muted-foreground text-sm">
                    This event supports {event.registrationType} registrations only.
                  </p>
                )}
              </div>

              {effectiveRegistrationType === "team" && (
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
                        <SelectItem value="__select__">Select a team</SelectItem>
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

              {resolvedGroupType !== "individual" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Invite Group Members</h3>
                      <p className="text-muted-foreground text-sm">
                        Add participant emails to share the registration details. Invites
                        will remain pending until members accept.
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={(event) => setInviteEmail(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value) =>
                            setInviteRole(value as RegistrationInviteRole)
                          }
                        >
                          <SelectTrigger id="invite-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {groupRoleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        className="mt-2 md:mt-0"
                        onClick={handleAddInvite}
                        disabled={!inviteEmail.trim()}
                      >
                        <UserPlusIcon className="mr-2 h-4 w-4" />
                        Add Invite
                      </Button>
                    </div>

                    {inviteDrafts.length > 0 ? (
                      <div className="space-y-2">
                        {inviteDrafts.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-muted-foreground">
                                Role: {invite.role}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">Pending invite</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveInvite(invite.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          No invites added yet. You can finish registration now and invite
                          members later.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
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

              {event.requireMembership && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Membership Requirement</h3>
                    {hasActiveMembership ? (
                      <Alert>
                        <AlertTitle>Active membership on file</AlertTitle>
                        <AlertDescription>
                          Your membership is active, so no additional purchase is needed
                          to register for this event.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="membership-type">Select membership</Label>
                        <Select
                          value={resolvedMembershipTypeId}
                          onValueChange={(value) => setMembershipTypeId(value)}
                        >
                          <SelectTrigger id="membership-type">
                            <SelectValue placeholder="Choose a membership option" />
                          </SelectTrigger>
                          <SelectContent>
                            {membershipTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} — ${(type.priceCents / 100).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">
                          Membership is required for this event and will be included in
                          checkout.
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {requiresPayment ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Payment Method</h3>
                  {visiblePendingCheckout && (
                    <Alert>
                      <AlertTitle>Pending checkout detected</AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>
                          You have a pending checkout from{" "}
                          {format(
                            new Date(visiblePendingCheckout.createdAt),
                            "MMM d, yyyy h:mm a",
                          )}
                          . Resume to avoid creating a duplicate payment.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" onClick={handleResumeCheckout}>
                            Resume Checkout
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearPendingCheckout}
                          >
                            Clear Pending Checkout
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
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
                            ${totalFee.toFixed(2)}
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
                              ${totalFee.toFixed(2)}
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
                {requiresMembershipSelection && (
                  <div className="flex items-center justify-between">
                    <span>Membership</span>
                    <span className="font-semibold">${membershipFee.toFixed(2)}</span>
                  </div>
                )}
                {requiresMembershipSelection && (
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold">${totalFee.toFixed(2)}</span>
                  </div>
                )}
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
