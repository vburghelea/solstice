import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { createEvent } from "../events.mutations";
import type { EventOperationResult, EventWithDetails } from "../events.types";

const EVENT_TYPE_OPTIONS = [
  { value: "tournament", label: "Tournament" },
  { value: "league", label: "League" },
  { value: "camp", label: "Training Camp" },
  { value: "clinic", label: "Skills Clinic" },
  { value: "social", label: "Social Event" },
  { value: "other", label: "Other" },
];

const EVENT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft (Not visible)" },
  { value: "published", label: "Published (Visible)" },
  { value: "registration_open", label: "Registration Open" },
];

const PROVINCE_OPTIONS = [
  { value: "", label: "Select Province" },
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
];

const REGISTRATION_TYPE_OPTIONS = [
  { value: "team", label: "Team" },
  { value: "individual", label: "Individual" },
  { value: "both", label: "Team & Individual" },
];

function Separator() {
  return <div className="border-t" />;
}

const eventFormSchema = z
  .object({
    name: z.string().min(1, "Event name is required").max(255),
    slug: z
      .string()
      .min(1, "URL slug is required")
      .max(255)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
    shortDescription: z
      .string()
      .max(500, "Short description must be under 500 characters")
      .optional(),
    type: z.enum(["tournament", "league", "camp", "clinic", "social", "other"]),
    status: z.enum(["draft", "published", "registration_open"]),
    venueName: z.string().max(255).optional(),
    venueAddress: z.string().optional(),
    city: z.string().max(100).optional(),
    province: z.string().max(50).optional(),
    postalCode: z.string().max(10).optional(),
    locationNotes: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    registrationOpensAt: z.string().optional(),
    registrationClosesAt: z.string().optional(),
    registrationType: z.enum(["team", "individual", "both"]),
    maxTeams: z.number().min(1).optional(),
    maxParticipants: z.number().min(1).optional(),
    minPlayersPerTeam: z.number().min(1).prefault(7),
    maxPlayersPerTeam: z.number().min(1).prefault(21),
    teamRegistrationFee: z.number().min(0).prefault(0),
    individualRegistrationFee: z.number().min(0).prefault(0),
    earlyBirdDiscount: z.number().min(0).max(100).prefault(0),
    earlyBirdDeadline: z.string().optional(),
    contactEmail: z.email().optional(),
    contactPhone: z.string().optional(),
    websiteUrl: z.url().optional().or(z.literal("")),
    allowWaitlist: z.boolean().prefault(false),
    requireMembership: z.boolean().prefault(false),
    allowEtransfer: z.boolean().prefault(false),
    etransferRecipient: z
      .email("Enter a valid e-transfer email")
      .optional()
      .or(z.literal("")),
    etransferInstructions: z.string().max(2000).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.allowEtransfer) {
      const recipient = values.etransferRecipient?.trim() ?? "";
      if (!recipient) {
        ctx.addIssue({
          path: ["etransferRecipient"],
          code: "custom",
          message: "E-transfer recipient email is required when e-transfer is enabled",
        });
      }
    }
  });

type EventFormData = z.infer<typeof eventFormSchema>;

export function EventCreateForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const slugManuallyEditedRef = useRef(false);

  const defaultValues: EventFormData = {
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    type: "tournament",
    status: "draft",
    venueName: "",
    venueAddress: "",
    city: "",
    province: "",
    postalCode: "",
    locationNotes: "",
    startDate: "",
    endDate: "",
    registrationOpensAt: "",
    registrationClosesAt: "",
    registrationType: "team",
    maxTeams: undefined,
    maxParticipants: undefined,
    minPlayersPerTeam: 7,
    maxPlayersPerTeam: 21,
    teamRegistrationFee: 0,
    individualRegistrationFee: 0,
    earlyBirdDiscount: 0,
    earlyBirdDeadline: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    allowWaitlist: false,
    requireMembership: false,
    allowEtransfer: false,
    etransferRecipient: "",
    etransferInstructions: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const validationResult = eventFormSchema.safeParse(value);

      if (!validationResult.success) {
        const firstIssue = validationResult.error.issues[0];
        toast.error(firstIssue?.message ?? "Please fix the highlighted fields.");
        return;
      }

      const parsed = validationResult.data;

      const formData: EventFormData = {
        ...parsed,
        teamRegistrationFee: Math.round((parsed.teamRegistrationFee || 0) * 100),
        individualRegistrationFee: Math.round(
          (parsed.individualRegistrationFee || 0) * 100,
        ),
        description: parsed.description || undefined,
        shortDescription: parsed.shortDescription || undefined,
        venueName: parsed.venueName || undefined,
        venueAddress: parsed.venueAddress || undefined,
        city: parsed.city || undefined,
        province: parsed.province || undefined,
        postalCode: parsed.postalCode || undefined,
        locationNotes: parsed.locationNotes || undefined,
        registrationOpensAt: parsed.registrationOpensAt || undefined,
        registrationClosesAt: parsed.registrationClosesAt || undefined,
        earlyBirdDeadline: parsed.earlyBirdDeadline || undefined,
        contactEmail: parsed.contactEmail || undefined,
        contactPhone: parsed.contactPhone || undefined,
        websiteUrl: parsed.websiteUrl,
        maxTeams: parsed.maxTeams,
        maxParticipants: parsed.maxParticipants,
        minPlayersPerTeam: parsed.minPlayersPerTeam,
        maxPlayersPerTeam: parsed.maxPlayersPerTeam,
        status: parsed.status,
        allowEtransfer: parsed.allowEtransfer ?? false,
        etransferRecipient: parsed.etransferRecipient?.trim()
          ? parsed.etransferRecipient.trim()
          : undefined,
        etransferInstructions: parsed.etransferInstructions?.trim()
          ? parsed.etransferInstructions.trim()
          : undefined,
      };

      createMutation.mutate(formData);
    },
  });

  const formState = useStore(form.store, (state) => state);

  useEffect(() => {
    const generatedSlug = generateSlug(formState.values.name ?? "");
    if (!slugManuallyEditedRef.current && formState.values.slug !== generatedSlug) {
      form.setFieldValue("slug", generatedSlug);
    }
  }, [form, formState.values.name, formState.values.slug]);

  useEffect(() => {
    if (!formState.values.slug) {
      slugManuallyEditedRef.current = false;
    }
  }, [formState.values.slug]);

  const createMutation = useMutation<
    EventOperationResult<EventWithDetails>,
    Error,
    EventFormData
  >({
    mutationFn: async (data: EventFormData) =>
      createEvent({ data }) as Promise<EventOperationResult<EventWithDetails>>,
    onSuccess: (result) => {
      if (!result.success) {
        const errorMessage = result.errors[0]?.message ?? "Failed to create event";
        toast.error(errorMessage);
        return;
      }

      toast.success("Event created successfully!");

      navigate({ to: "/dashboard/events/$slug", params: { slug: result.data.slug } });
    },
    onError: (error) => {
      toast.error("An error occurred while creating the event");
      console.error(error);
    },
  });

  const steps = [
    { title: "Basic Info", description: "Event name and description" },
    { title: "Location & Dates", description: "Where and when" },
    { title: "Registration", description: "Registration settings and pricing" },
    { title: "Additional Details", description: "Contact info and settings" },
  ];

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return Boolean(formState.values.name?.trim() && formState.values.slug?.trim());
      case 1:
        return Boolean(formState.values.startDate && formState.values.endDate);
      default:
        return true;
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>
          Fill in the details to create a new Quadball event. You can save as draft and
          publish later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex-1 ${index !== steps.length - 1 ? "relative" : ""}`}
              >
                <div
                  className={`flex items-center ${
                    index <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      index <= currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm leading-tight font-medium">{step.title}</div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-5 h-0.5 w-full ${
                      index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    style={{ width: "calc(100% - 2.5rem)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {currentStep === 0 && (
            <div className="space-y-6">
              <form.Field name="name">
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="Event Name"
                    placeholder="2024 Summer Championship"
                    required
                    onValueChange={(value) => {
                      field.handleChange(value);
                      if (!value) {
                        slugManuallyEditedRef.current = false;
                      }
                    }}
                  />
                )}
              </form.Field>

              <form.Field name="slug">
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="URL Slug"
                    placeholder="2024-summer-championship"
                    description="This will be used in the event URL"
                    required
                    onValueChange={(value) => {
                      field.handleChange(value);
                      const generated = generateSlug(formState.values.name ?? "");
                      slugManuallyEditedRef.current =
                        Boolean(value) && value !== generated;
                    }}
                  />
                )}
              </form.Field>

              <form.Field name="shortDescription">
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="Short Description"
                    placeholder="Brief description for event cards and previews"
                    description="Max 500 characters"
                    maxLength={500}
                  />
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Full Description</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Detailed event description..."
                      rows={6}
                      className="resize-none"
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="type">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Event Type"
                      options={EVENT_TYPE_OPTIONS}
                      required
                    />
                  )}
                </form.Field>

                <form.Field name="status">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Initial Status"
                      options={EVENT_STATUS_OPTIONS}
                      required
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="venueName">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Venue Name"
                      placeholder="Community Sports Complex"
                    />
                  )}
                </form.Field>

                <form.Field name="venueAddress">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Venue Address"
                      placeholder="123 Main Street"
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput field={field} label="City" placeholder="Toronto" />
                  )}
                </form.Field>

                <form.Field name="province">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Province"
                      options={PROVINCE_OPTIONS}
                    />
                  )}
                </form.Field>

                <form.Field name="postalCode">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Postal Code"
                      placeholder="M5V 3A8"
                    />
                  )}
                </form.Field>
              </div>

              <form.Field name="locationNotes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Location Notes</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Parking information, directions, accessibility notes..."
                      rows={3}
                      className="resize-none"
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="startDate">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Start Date"
                      type="date"
                      required
                      onValueChange={(value) => {
                        field.handleChange(value);
                        if (!formState.values.endDate) {
                          form.setFieldValue("endDate", value);
                        }
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="endDate">
                  {(field) => (
                    <ValidatedInput field={field} label="End Date" type="date" required />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="registrationOpensAt">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Registration Opens"
                      type="date"
                    />
                  )}
                </form.Field>

                <form.Field name="registrationClosesAt">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Registration Closes"
                      type="date"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <form.Field name="registrationType">
                {(field) => (
                  <ValidatedSelect
                    field={field}
                    label="Registration Type"
                    options={REGISTRATION_TYPE_OPTIONS}
                    required
                  />
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="maxTeams">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Maximum Teams"
                      type="number"
                      min={1}
                      onValueChange={(value) => {
                        const nextValue = value ? Number.parseInt(value, 10) : undefined;
                        field.handleChange(nextValue as unknown as number);
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="maxParticipants">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Maximum Participants"
                      type="number"
                      min={1}
                      onValueChange={(value) => {
                        const nextValue = value ? Number.parseInt(value, 10) : undefined;
                        field.handleChange(nextValue as unknown as number);
                      }}
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="minPlayersPerTeam">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Minimum Players per Team"
                      type="number"
                      min={1}
                      onValueChange={(value) => {
                        const nextValue = value ? Number.parseInt(value, 10) : undefined;
                        field.handleChange(nextValue as unknown as number);
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="maxPlayersPerTeam">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Maximum Players per Team"
                      type="number"
                      min={1}
                      onValueChange={(value) => {
                        const nextValue = value ? Number.parseInt(value, 10) : undefined;
                        field.handleChange(nextValue as unknown as number);
                      }}
                    />
                  )}
                </form.Field>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="teamRegistrationFee">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Team Registration Fee ($)"
                        type="number"
                        min={0}
                        step="0.01"
                        onValueChange={(value) => {
                          field.handleChange(value === "" ? 0 : Number.parseFloat(value));
                        }}
                      />
                    )}
                  </form.Field>

                  <form.Field name="individualRegistrationFee">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Individual Registration Fee ($)"
                        type="number"
                        min={0}
                        step="0.01"
                        onValueChange={(value) => {
                          field.handleChange(value === "" ? 0 : Number.parseFloat(value));
                        }}
                      />
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Early Bird Discount</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="earlyBirdDiscount">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Discount Percentage"
                        type="number"
                        min={0}
                        max={100}
                        onValueChange={(value) => {
                          field.handleChange(
                            value === "" ? 0 : Number.parseInt(value, 10),
                          );
                        }}
                        description="Percentage discount for early registration"
                      />
                    )}
                  </form.Field>

                  <form.Field name="earlyBirdDeadline">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Early Bird Deadline"
                        type="date"
                        disabled={!formState.values.earlyBirdDiscount}
                      />
                    )}
                  </form.Field>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alternate Payment Options</h3>
                <form.Field name="allowEtransfer">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Allow Interac e-Transfer"
                      description="Let registrants choose e-transfer instead of Square checkout"
                    />
                  )}
                </form.Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="etransferRecipient">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="E-transfer Recipient Email"
                        type="email"
                        disabled={!formState.values.allowEtransfer}
                        onValueChange={(value) => field.handleChange(value ?? "")}
                        description="Where e-transfer payments should be sent"
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="etransferInstructions">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="etransferInstructions">
                        E-transfer Instructions
                      </Label>
                      <Textarea
                        id="etransferInstructions"
                        placeholder="Include the security question, expected password, or any other notes for e-transfer payments."
                        value={field.state.value ?? ""}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        disabled={!formState.values.allowEtransfer}
                        className="min-h-[120px]"
                      />
                      {field.state.meta.errors?.length ? (
                        <p className="text-destructive text-sm">
                          {field.state.meta.errors[0]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="space-y-4">
                <form.Field name="allowWaitlist">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Allow Waitlist"
                      description="Allow registrations to join a waitlist when the event is full"
                    />
                  )}
                </form.Field>

                <form.Field name="requireMembership">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Require Active Membership"
                      description="Only allow users with active Quadball Canada memberships to register"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="contactEmail">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Contact Email"
                        type="email"
                        placeholder="event@example.com"
                      />
                    )}
                  </form.Field>

                  <form.Field name="contactPhone">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Contact Phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="websiteUrl">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Event Website"
                      type="url"
                      placeholder="https://example.com/event"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() =>
                  setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
                }
                disabled={!canProceedToNext()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <FormSubmitButton
                isSubmitting={createMutation.isPending}
                loadingText="Creating..."
                disabled={!formState.canSubmit}
              >
                Create Event
              </FormSubmitButton>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
