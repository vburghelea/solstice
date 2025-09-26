import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, ArrowRight, InfoIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import { COUNTRIES } from "~/shared/hooks/useCountries";
import { createEvent, uploadEventImage } from "../events.mutations";
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
    logoUrl: z.string().url().optional().or(z.literal("")),
    bannerUrl: z.string().url().optional().or(z.literal("")),
    venueName: z.string().max(255).optional(),
    venueAddress: z.string().optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(50).optional(),
    postalCode: z.string().max(10).optional(),
    locationNotes: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    registrationOpensAt: z.string().optional(),
    registrationClosesAt: z.string().optional(),
    registrationType: z.enum(["team", "individual", "both"]),
    maxTeams: z.number().min(1).optional(),
    maxParticipants: z.number().min(1).optional(),
    minPlayersPerTeam: z.number().min(1).default(7),
    maxPlayersPerTeam: z.number().min(1).default(21),
    teamRegistrationFee: z.number().min(0).default(0),
    individualRegistrationFee: z.number().min(0).default(0),
    earlyBirdDiscount: z.number().min(0).max(100).default(0),
    earlyBirdDeadline: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    isPublic: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    allowWaitlist: z.boolean().default(false),
    requireMembership: z.boolean().default(false),
    allowEtransfer: z.boolean().default(false),
    etransferRecipient: z
      .string()
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
          code: z.ZodIssueCode.custom,
          message: "E-transfer recipient email is required when e-transfer is enabled",
        });
      }
    }

    if (values.earlyBirdDiscount > 0 && !values.earlyBirdDeadline) {
      ctx.addIssue({
        path: ["earlyBirdDeadline"],
        code: z.ZodIssueCode.custom,
        message: "Early bird deadline is required when a discount is provided",
      });
    }

    if (values.earlyBirdDiscount === 0 && values.earlyBirdDeadline) {
      ctx.addIssue({
        path: ["earlyBirdDiscount"],
        code: z.ZodIssueCode.custom,
        message: "Set a discount percentage or remove the deadline",
      });
    }
  });

type EventFormData = z.infer<typeof eventFormSchema>;

export function EventCreateForm() {
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: "/dashboard/events/create" });
  const isAdminUser = useMemo(() => isAdminClient(user), [user]);
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
    country: "",
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
    logoUrl: "",
    bannerUrl: "",
    isPublic: true,
    isFeatured: false,
    allowWaitlist: false,
    requireMembership: false,
    allowEtransfer: false,
    etransferRecipient: "",
    etransferInstructions: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isLogoUploading || isBannerUploading) {
        toast.info("Please wait for image uploads to complete before submitting.");
        return;
      }

      const validationResult = eventFormSchema.safeParse(value);

      if (!validationResult.success) {
        const firstIssue = validationResult.error.issues[0];
        toast.error(firstIssue?.message ?? "Please fix the highlighted fields.");
        return;
      }

      const parsed = validationResult.data;

      const normalizedLogoUrl =
        typeof parsed.logoUrl === "string" && parsed.logoUrl.trim().length > 0
          ? parsed.logoUrl.trim()
          : undefined;
      const normalizedBannerUrl =
        typeof parsed.bannerUrl === "string" && parsed.bannerUrl.trim().length > 0
          ? parsed.bannerUrl.trim()
          : undefined;

      const formData: EventFormData = {
        ...parsed,
        teamRegistrationFee: Math.round((parsed.teamRegistrationFee || 0) * 100),
        individualRegistrationFee: Math.round(
          (parsed.individualRegistrationFee || 0) * 100,
        ),
        earlyBirdDiscount: Math.round(parsed.earlyBirdDiscount || 0),
        description: parsed.description || undefined,
        shortDescription: parsed.shortDescription || undefined,
        logoUrl: normalizedLogoUrl,
        bannerUrl: normalizedBannerUrl,
        venueName: parsed.venueName || undefined,
        venueAddress: parsed.venueAddress || undefined,
        city: parsed.city || undefined,
        country: parsed.country || undefined,
        postalCode: parsed.postalCode || undefined,
        locationNotes: parsed.locationNotes || undefined,
        registrationOpensAt: parsed.registrationOpensAt || undefined,
        registrationClosesAt: parsed.registrationClosesAt || undefined,
        earlyBirdDeadline: parsed.earlyBirdDeadline || undefined,
        contactEmail: parsed.contactEmail || undefined,
        contactPhone: parsed.contactPhone || undefined,
        websiteUrl: parsed.websiteUrl?.trim() || undefined,
        maxTeams: parsed.maxTeams,
        maxParticipants: parsed.maxParticipants,
        minPlayersPerTeam: parsed.minPlayersPerTeam,
        maxPlayersPerTeam: parsed.maxPlayersPerTeam,
        isPublic: isAdminUser ? parsed.isPublic : false,
        isFeatured: isAdminUser ? parsed.isFeatured : false,
        status: !isAdminUser && parsed.isPublic ? "draft" : parsed.status,
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

  const uploadEventAsset = async (file: File, kind: "logo" | "banner") => {
    const base64 = await readFileAsDataUrl(file);
    const result = (await uploadEventImage({
      data: { file: base64, kind },
    })) as EventOperationResult<{ url: string; publicId: string }>;

    if (!result.success) {
      throw new Error(result.errors[0]?.message ?? "Failed to upload image");
    }

    return result.data.url;
  };

  const logoPreviousUrlRef = useRef<string | null>(null);
  const bannerPreviousUrlRef = useRef<string | null>(null);
  const pendingLogoFileRef = useRef<File | null>(null);
  const pendingBannerFileRef = useRef<File | null>(null);

  const logoUploadMutation = useMutation<string, Error, File>({
    mutationFn: (file) => uploadEventAsset(file, "logo"),
    onSuccess: (url) => {
      form.setFieldValue("logoUrl", url);
      toast.success("Logo uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload logo");
      form.setFieldValue("logoUrl", logoPreviousUrlRef.current ?? "");
    },
  });

  const bannerUploadMutation = useMutation<string, Error, File>({
    mutationFn: (file) => uploadEventAsset(file, "banner"),
    onSuccess: (url) => {
      form.setFieldValue("bannerUrl", url);
      toast.success("Banner uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload banner");
      form.setFieldValue("bannerUrl", bannerPreviousUrlRef.current ?? "");
    },
  });

  const { mutate: mutateLogoUpload, isPending: isLogoUploading } = logoUploadMutation;
  const { mutate: mutateBannerUpload, isPending: isBannerUploading } =
    bannerUploadMutation;

  const formState = useStore(form.store, (state) => state);

  useEffect(() => {
    const rawValue = formState.values.logoUrl as unknown;
    if (typeof rawValue === "string") {
      logoPreviousUrlRef.current = rawValue.length > 0 ? rawValue : null;
    }

    if (rawValue instanceof File) {
      if (pendingLogoFileRef.current === rawValue || isLogoUploading) {
        return;
      }
      pendingLogoFileRef.current = rawValue;
      mutateLogoUpload(rawValue, {
        onSettled: () => {
          pendingLogoFileRef.current = null;
        },
      });
    }
  }, [formState.values.logoUrl, isLogoUploading, mutateLogoUpload]);

  useEffect(() => {
    const rawValue = formState.values.bannerUrl as unknown;
    if (typeof rawValue === "string") {
      bannerPreviousUrlRef.current = rawValue.length > 0 ? rawValue : null;
    }

    if (rawValue instanceof File) {
      if (pendingBannerFileRef.current === rawValue || isBannerUploading) {
        return;
      }
      pendingBannerFileRef.current = rawValue;
      mutateBannerUpload(rawValue, {
        onSettled: () => {
          pendingBannerFileRef.current = null;
        },
      });
    }
  }, [formState.values.bannerUrl, isBannerUploading, mutateBannerUpload]);

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

      if (!isAdminUser && formState.values.isPublic) {
        toast.success(
          "Event created! It will be reviewed by an admin before becoming public.",
        );
      } else {
        toast.success("Event created successfully!");
      }

      navigate({ to: "/events/$slug", params: { slug: result.data.slug } });
    },
    onError: (error) => {
      toast.error("An error occurred while creating the event");
      console.error(error);
    },
  });

  const isUploadingAssets = isLogoUploading || isBannerUploading;

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
          Fill in the details to create a new Roundup Games event. You can save as draft
          and publish later.
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

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Branding</h3>
                <p className="text-muted-foreground text-sm">
                  Add visuals to personalize your event. Upload images or paste URLs for
                  assets you already host.
                </p>

                <form.Field name="logoUrl">
                  {(field) => (
                    <div className="space-y-3">
                      <ValidatedFileUpload
                        field={field}
                        label="Event Logo"
                        accept="image/*"
                        maxSizeMb={5}
                        helperText={
                          isLogoUploading
                            ? "Uploading logo..."
                            : "Ideal size is a square PNG or JPG up to 5MB."
                        }
                        description="Displayed on compact cards and featured sections."
                      />
                      <ValidatedInput
                        field={field}
                        type="url"
                        label="Logo URL (optional)"
                        placeholder="https://cdn.example.com/event-logo.png"
                        description="Paste a hosted logo URL if you already have one."
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="bannerUrl">
                  {(field) => (
                    <div className="space-y-3">
                      <ValidatedFileUpload
                        field={field}
                        label="Hero Banner"
                        accept="image/*"
                        maxSizeMb={8}
                        helperText={
                          isBannerUploading
                            ? "Uploading banner..."
                            : "Use a wide image (16:9) up to 8MB for the event hero."
                        }
                        description="Shown on the public event page and featured listings."
                      />
                      <ValidatedInput
                        field={field}
                        type="url"
                        label="Banner URL (optional)"
                        placeholder="https://cdn.example.com/event-banner.jpg"
                        description="Paste a hosted banner URL if you've already uploaded one."
                      />
                    </div>
                  )}
                </form.Field>
              </div>

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
                    <ValidatedInput field={field} label="City" placeholder="Berlin" />
                  )}
                </form.Field>

                <form.Field name="country">
                  {(field) => (
                    <ValidatedSelect field={field} label="Country" options={COUNTRIES} />
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
                        const nextValue =
                          value === "" ? undefined : Number.parseInt(value, 10);
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
                        const nextValue =
                          value === "" ? undefined : Number.parseInt(value, 10);
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
                        const nextValue =
                          value === "" ? undefined : Number.parseInt(value, 10);
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
                        const nextValue =
                          value === "" ? undefined : Number.parseInt(value, 10);
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
                          const nextValue =
                            value === "" ? undefined : Number.parseFloat(value);
                          field.handleChange(nextValue as unknown as number);
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
                          const nextValue =
                            value === "" ? undefined : Number.parseFloat(value);
                          field.handleChange(nextValue as unknown as number);
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
                          const nextValue =
                            value === "" ? undefined : Number.parseInt(value, 10);
                          field.handleChange(nextValue as unknown as number);
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
                      description="Only allow users with active Roundup Games memberships to register"
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

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visibility Settings</h3>

                {!isAdminUser && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Admin Approval Required</AlertTitle>
                    <AlertDescription>
                      Your event will be created as a draft and will require admin
                      approval before it becomes publicly visible. You can still manage
                      and edit your event while it's pending approval.
                    </AlertDescription>
                  </Alert>
                )}

                <form.Field name="isPublic">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Public Event"
                      description={
                        isAdminUser
                          ? "Make this event visible to everyone"
                          : "Request public visibility (requires admin approval)"
                      }
                      disabled={!isAdminUser}
                    />
                  )}
                </form.Field>

                <form.Field name="isFeatured">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Featured Event"
                      description="Highlight this event on the homepage and in search results"
                      disabled={!isAdminUser}
                    />
                  )}
                </form.Field>
              </div>

              {!isAdminUser && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    After creating your event, an administrator will review it and approve
                    it for public visibility. You'll be notified once your event is
                    approved.
                  </AlertDescription>
                </Alert>
              )}
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
                disabled={!canProceedToNext() || isUploadingAssets}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <FormSubmitButton
                isSubmitting={createMutation.isPending}
                loadingText="Creating..."
                disabled={!formState.canSubmit || isUploadingAssets}
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

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
