import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, ArrowRight, InfoIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedCountryCombobox } from "~/components/form-fields/ValidatedCountryCombobox";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
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
import { useEventsTranslation } from "~/hooks/useTypedTranslation";
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import { createEvent, uploadEventImage } from "../events.mutations";
import type { EventOperationResult, EventWithDetails } from "../events.types";

// Let the form schema infer the type
type EventFormData = Record<string, unknown>; // We'll let Zod handle validation

function getEventTypeOptions(
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  return [
    { value: "tournament", label: t("types.tournament") },
    { value: "league", label: t("types.league") },
    { value: "camp", label: t("types.camp") },
    { value: "clinic", label: t("types.clinic") },
    { value: "social", label: t("types.social") },
    { value: "other", label: t("types.other") },
  ];
}

function getEventStatusOptions(
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  return [
    { value: "draft", label: t("status.draft") },
    { value: "published", label: t("status.published") },
    { value: "registration_open", label: t("status.registration_open") },
  ];
}

function getRegistrationTypeOptions(
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  return [
    { value: "team", label: t("registration_types.team") },
    { value: "individual", label: t("registration_types.individual") },
    { value: "both", label: t("registration_types.both") },
  ];
}

function Separator() {
  return <div className="border-t" />;
}

function getDateInputString(daysFromToday: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0];
}

function getNextDayString(dateString: string) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

// Remove explicit type definition and let Zod infer it
// type EventFormData = z.infer<ReturnType<typeof eventFormSchema>>;

export function EventCreateForm() {
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: "/player/events/create" });
  const isAdminUser = useMemo(() => isAdminClient(user), [user]);
  const { t } = useEventsTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const slugManuallyEditedRef = useRef(false);
  const defaultStartDate = useMemo(() => getDateInputString(7), []);
  const defaultEndDate = useMemo(
    () => getNextDayString(defaultStartDate),
    [defaultStartDate],
  );

  const eventFormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("validation.name_required")).max(255),
          slug: z
            .string()
            .min(1, t("validation.slug_required"))
            .max(255)
            .regex(/^[a-z0-9-]+$/, t("validation.slug_format")),
          description: z.string().optional(),
          shortDescription: z
            .string()
            .max(500, t("validation.short_description_max"))
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
          startDate: z.string().min(1, t("validation.start_date_required")),
          endDate: z.string().min(1, t("validation.end_date_required")),
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
            .email(t("validation.valid_etransfer_email"))
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
                message: t("validation.etransfer_recipient_required"),
              });
            }
          }

          if (values.earlyBirdDiscount > 0 && !values.earlyBirdDeadline) {
            ctx.addIssue({
              path: ["earlyBirdDeadline"],
              code: z.ZodIssueCode.custom,
              message: t("validation.early_bird_deadline_required"),
            });
          }

          if (values.earlyBirdDiscount === 0 && values.earlyBirdDeadline) {
            ctx.addIssue({
              path: ["earlyBirdDiscount"],
              code: z.ZodIssueCode.custom,
              message: t("validation.early_bird_discount_required"),
            });
          }
        }),
    [t],
  );

  const EVENT_TYPE_OPTIONS = useMemo(() => getEventTypeOptions(t), [t]);
  const EVENT_STATUS_OPTIONS = useMemo(() => getEventStatusOptions(t), [t]);
  const REGISTRATION_TYPE_OPTIONS = useMemo(() => getRegistrationTypeOptions(t), [t]);

  const defaultValues = {
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    type: "tournament" as const,
    status: "draft" as const,
    venueName: "",
    venueAddress: "",
    city: "Berlin",
    country: "Germany",
    postalCode: "10115",
    locationNotes: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    registrationOpensAt: "",
    registrationClosesAt: "",
    registrationType: "team" as const,
    maxTeams: undefined as number | undefined,
    maxParticipants: undefined as number | undefined,
    minPlayersPerTeam: 7,
    maxPlayersPerTeam: 21,
    teamRegistrationFee: 0,
    individualRegistrationFee: 0,
    earlyBirdDiscount: 0,
    earlyBirdDeadline: "",
    contactEmail: "",
    contactPhone: "+4915123456789",
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
        toast.info(t("upload.wait_for_upload"));
        return;
      }

      const validationResult = eventFormSchema.safeParse(value);

      if (!validationResult.success) {
        const firstIssue = validationResult.error.issues[0];
        toast.error(firstIssue?.message ?? t("errors.validation_error"));
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

      const formData = {
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
      throw new Error(result.errors[0]?.message ?? t("errors.upload_failed"));
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
      toast.success(t("upload.logo_success"));
    },
    onError: (error) => {
      toast.error(error.message || t("upload.logo_failed"));
      form.setFieldValue("logoUrl", logoPreviousUrlRef.current ?? "");
    },
  });

  const bannerUploadMutation = useMutation<string, Error, File>({
    mutationFn: (file) => uploadEventAsset(file, "banner"),
    onSuccess: (url) => {
      form.setFieldValue("bannerUrl", url);
      toast.success(t("upload.banner_success"));
    },
    onError: (error) => {
      toast.error(error.message || t("upload.banner_failed"));
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
        const errorMessage = result.errors[0]?.message ?? t("errors.create_failed");
        toast.error(errorMessage);
        return;
      }

      if (!isAdminUser && formState.values.isPublic) {
        toast.success(t("success.created_pending_approval"));
      } else {
        toast.success(t("success.created"));
      }

      navigate({ to: "/events/$slug", params: { slug: result.data.slug } });
    },
    onError: (error) => {
      toast.error(t("errors.creation_error"));
      console.error(error);
    },
  });

  const isUploadingAssets = isLogoUploading || isBannerUploading;

  const steps = [
    {
      title: t("create.steps.basic_info.title"),
      description: t("create.steps.basic_info.description"),
    },
    {
      title: t("create.steps.location_dates.title"),
      description: t("create.steps.location_dates.description"),
    },
    {
      title: t("create.steps.registration.title"),
      description: t("create.steps.registration.description"),
    },
    {
      title: t("create.steps.details.title"),
      description: t("create.steps.details.description"),
    },
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
        <CardTitle>{t("create.title")}</CardTitle>
        <CardDescription>{t("create.subtitle")}</CardDescription>
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
                    label={t("form.fields.name")}
                    placeholder={t("form.placeholders.name")}
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
                    label={t("form.fields.slug")}
                    placeholder={t("form.placeholders.slug")}
                    description={t("form.descriptions.slug")}
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
                    label={t("form.fields.short_description")}
                    placeholder={t("form.placeholders.short_description")}
                    description={t("form.descriptions.short_description")}
                    maxLength={500}
                  />
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>{t("form.fields.description")}</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={t("form.placeholders.description")}
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
                <h3 className="text-lg font-semibold">
                  {t("form.sections.branding.title")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("form.sections.branding.description")}
                </p>

                <form.Field name="logoUrl">
                  {(field) => (
                    <div className="space-y-3">
                      <ValidatedFileUpload
                        field={field}
                        label={t("form.fields.logo")}
                        accept="image/*"
                        maxSizeMb={5}
                        helperText={
                          isLogoUploading
                            ? t("upload.logo_uploading")
                            : t("form.descriptions.logo_helper")
                        }
                        description={t("form.descriptions.logo")}
                      />
                      <ValidatedInput
                        field={field}
                        type="url"
                        label={t("form.fields.logo_url")}
                        placeholder={t("form.placeholders.logo_url")}
                        description={t("form.descriptions.logo")}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="bannerUrl">
                  {(field) => (
                    <div className="space-y-3">
                      <ValidatedFileUpload
                        field={field}
                        label={t("form.fields.banner")}
                        accept="image/*"
                        maxSizeMb={8}
                        helperText={
                          isBannerUploading
                            ? t("upload.banner_uploading")
                            : t("form.descriptions.banner_helper")
                        }
                        description={t("form.descriptions.banner")}
                      />
                      <ValidatedInput
                        field={field}
                        type="url"
                        label={t("form.fields.banner_url")}
                        placeholder={t("form.placeholders.banner_url")}
                        description={t("form.descriptions.banner")}
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
                      label={t("form.fields.type")}
                      options={EVENT_TYPE_OPTIONS}
                      required
                    />
                  )}
                </form.Field>

                <form.Field name="status">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label={t("form.fields.status")}
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
                      label={t("form.fields.venue_name")}
                      placeholder={t("form.placeholders.venue_name")}
                    />
                  )}
                </form.Field>

                <form.Field name="venueAddress">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.venue_address")}
                      placeholder={t("form.placeholders.venue_address")}
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.city")}
                      placeholder={t("form.placeholders.city")}
                    />
                  )}
                </form.Field>

                <form.Field name="country">
                  {(field) => (
                    <ValidatedCountryCombobox
                      field={field}
                      label={t("form.fields.country")}
                      placeholder={t("form.placeholders.country")}
                      valueFormat="label"
                    />
                  )}
                </form.Field>

                <form.Field name="postalCode">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.postal_code")}
                      placeholder={t("form.placeholders.postal_code")}
                    />
                  )}
                </form.Field>
              </div>

              <form.Field name="locationNotes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>{t("form.fields.location_notes")}</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={t("form.placeholders.location_notes")}
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
                      label={t("form.fields.start_date")}
                      type="date"
                      required
                      onValueChange={(value) => {
                        field.handleChange(value);
                        if (!value) {
                          return;
                        }
                        const nextDay = getNextDayString(value);
                        const currentEnd = formState.values.endDate as string | undefined;
                        if (!currentEnd || currentEnd < value) {
                          form.setFieldValue("endDate", nextDay);
                        }
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="endDate">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.end_date")}
                      type="date"
                      required
                      {...(formState.values.startDate
                        ? { min: formState.values.startDate as string }
                        : {})}
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="registrationOpensAt">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.registration_opens")}
                      type="date"
                    />
                  )}
                </form.Field>

                <form.Field name="registrationClosesAt">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.registration_closes")}
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
                    label={t("form.fields.registration_type")}
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
                      label={t("form.fields.max_teams")}
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
                      label={t("form.fields.max_participants")}
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
                      label={t("form.fields.min_players_per_team")}
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
                      label={t("form.fields.max_players_per_team")}
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
                <h3 className="text-lg font-semibold">
                  {t("form.sections.pricing.title")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="teamRegistrationFee">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label={t("form.fields.team_fee")}
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
                        label={t("form.fields.individual_fee")}
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
                <h3 className="text-lg font-semibold">
                  {t("form.sections.early_bird.title")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="earlyBirdDiscount">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label={t("form.fields.early_bird_discount")}
                        type="number"
                        min={0}
                        max={100}
                        onValueChange={(value) => {
                          const nextValue =
                            value === "" ? undefined : Number.parseInt(value, 10);
                          field.handleChange(nextValue as unknown as number);
                        }}
                        description={t("form.descriptions.early_bird_discount")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="earlyBirdDeadline">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label={t("form.fields.early_bird_deadline")}
                        type="date"
                        disabled={!formState.values.earlyBirdDiscount}
                      />
                    )}
                  </form.Field>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("form.sections.alternate_payment.title")}
                </h3>
                <form.Field name="allowEtransfer">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label={t("form.fields.allow_etransfer")}
                      description={t("form.descriptions.etransfer_recipient")}
                    />
                  )}
                </form.Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="etransferRecipient">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label={t("form.fields.etransfer_recipient")}
                        type="email"
                        disabled={!formState.values.allowEtransfer}
                        onValueChange={(value) => field.handleChange(value ?? "")}
                        description={t("form.descriptions.etransfer_recipient")}
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="etransferInstructions">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="etransferInstructions">
                        {t("form.fields.etransfer_instructions")}
                      </Label>
                      <Textarea
                        id="etransferInstructions"
                        placeholder={t("form.placeholders.etransfer_instructions")}
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
                      label={t("form.fields.allow_waitlist")}
                      description={t("form.descriptions.allow_waitlist")}
                    />
                  )}
                </form.Field>

                <form.Field name="requireMembership">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label={t("form.fields.require_membership")}
                      description={t("form.descriptions.require_membership")}
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("form.sections.contact_info.title")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="contactEmail">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label={t("form.fields.contact_email")}
                        type="email"
                        placeholder={t("form.placeholders.contact_email")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="contactPhone">
                    {(field) => (
                      <ValidatedPhoneInput
                        field={field}
                        label={t("form.fields.contact_phone")}
                        placeholder={t("form.placeholders.contact_phone")}
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="websiteUrl">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("form.fields.website")}
                      type="url"
                      placeholder={t("form.placeholders.website")}
                    />
                  )}
                </form.Field>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("form.sections.visibility.title")}
                </h3>

                {!isAdminUser && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>{t("alerts.admin_approval.title")}</AlertTitle>
                    <AlertDescription>
                      {t("alerts.admin_approval.description")}
                    </AlertDescription>
                  </Alert>
                )}

                <form.Field name="isPublic">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label={t("form.fields.public_event")}
                      description={
                        isAdminUser
                          ? t("form.descriptions.public_event_admin")
                          : t("form.descriptions.public_event_user")
                      }
                      disabled={!isAdminUser}
                    />
                  )}
                </form.Field>

                <form.Field name="isFeatured">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label={t("form.fields.featured_event")}
                      description={t("form.descriptions.featured_event")}
                      disabled={!isAdminUser}
                    />
                  )}
                </form.Field>
              </div>

              {!isAdminUser && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    {t("alerts.approval_process.description")}
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
              {t("buttons.previous")}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() =>
                  setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
                }
                disabled={!canProceedToNext() || isUploadingAssets}
              >
                {t("buttons.next")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <FormSubmitButton
                isSubmitting={createMutation.isPending}
                loadingText={t("buttons.creating")}
                disabled={!formState.canSubmit || isUploadingAssets}
              >
                {t("buttons.create")}
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
