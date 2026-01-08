import { useForm } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { campaignRecurrenceEnum } from "~/db/schema/campaigns.schema";
import { visibilityEnum } from "~/db/schema/shared.schema"; // Added visibilityEnum
import {
  campaignExpectationsSchema, // Import new schema
  createCampaignInputSchema,
  sessionZeroSchema, // Import new schema
  tableExpectationsSchema, // Import new schema
  updateCampaignInputSchema,
} from "~/features/campaigns/campaigns.schemas";
import { GameSystemCombobox } from "~/features/games/components/GameSystemCombobox";
import { useGameSystemSearch } from "~/features/games/hooks/useGameSystemSearch";
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
  xCardSystemEnum,
} from "~/shared/schemas/common";
import { languageOptions } from "~/shared/types/common";
import { FormSection } from "~/shared/ui/form-section";

interface CampaignFormProps {
  initialValues?: Partial<z.infer<typeof updateCampaignInputSchema>> & {
    // Use Partial for all optional fields
    characterCreationOutcome?: string | null | undefined; // Explicitly allow undefined
    sessionZeroData?: z.infer<typeof sessionZeroSchema> | null | undefined; // Explicitly allow undefined
    campaignExpectations?: z.infer<typeof campaignExpectationsSchema> | null | undefined; // Explicitly allow undefined
    tableExpectations?: z.infer<typeof tableExpectationsSchema> | null | undefined; // Explicitly allow undefined
  };
  onSubmit: (
    values:
      | z.infer<typeof createCampaignInputSchema>
      | z.infer<typeof updateCampaignInputSchema>,
  ) => Promise<void>;
  isSubmitting: boolean;
  onCancelEdit?: () => void;
  isGameSystemReadOnly?: boolean;
  gameSystemName?: string;
}

export function CampaignForm({
  initialValues,
  onSubmit,
  isSubmitting,
  onCancelEdit,
  isGameSystemReadOnly,
  gameSystemName,
}: CampaignFormProps) {
  const { t } = useCampaignsTranslation();
  const defaults = {
    gameSystemId: initialValues?.gameSystemId ?? undefined,
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    recurrence: initialValues?.recurrence ?? "weekly",
    timeOfDay: initialValues?.timeOfDay ?? "",
    sessionDuration: initialValues?.sessionDuration ?? undefined,
    pricePerSession: initialValues?.pricePerSession ?? undefined,
    language: initialValues?.language ?? "",
    location: initialValues?.location ?? { address: "", lat: 0, lng: 0 },
    visibility: initialValues?.visibility ?? "public",
    minimumRequirements: initialValues?.minimumRequirements ?? {
      minPlayers: undefined,
      maxPlayers: undefined,
    },
    safetyRules: {
      "no-alcohol": false,
      "safe-word": false,
      openCommunication: false,
      xCardSystem: null,
      xCardDetails: null,
      playerBoundariesConsent: null,
      ...(initialValues?.safetyRules || {}),
    },
  } as const;

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      await onSubmit(
        value as
          | z.infer<typeof createCampaignInputSchema>
          | z.infer<typeof updateCampaignInputSchema>,
      );
    },
  });

  const {
    setSearchTerm: setGameSystemSearchTerm,
    results: gameSystemResults,
    options: gameSystemOptions,
    isLoading: isLoadingGameSystems,
  } = useGameSystemSearch();

  // State to store the selected game system details
  const [selectedGameSystem, setSelectedGameSystem] = useState<{
    id: number;
    name: string;
    averagePlayTime: number | null;
    minPlayers: number | null;
    maxPlayers: number | null;
  } | null>(null);

  // Update form fields when game system changes
  useEffect(() => {
    if (selectedGameSystem) {
      form.setFieldValue("sessionDuration", selectedGameSystem.averagePlayTime || 1);
      form.setFieldValue(
        "minimumRequirements.minPlayers",
        selectedGameSystem.minPlayers || 1,
      );
      form.setFieldValue(
        "minimumRequirements.maxPlayers",
        selectedGameSystem.maxPlayers || 1,
      );
    }
  }, [form, selectedGameSystem]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-8"
    >
      <FormSection
        title={t("form_sections.campaign_overview")}
        description={t("descriptions.campaign_overview")}
        contentClassName="space-y-6"
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null || value === "") {
                  return undefined;
                }
              }
              try {
                const schema = initialValues
                  ? updateCampaignInputSchema
                  : createCampaignInputSchema;
                schema.shape.name.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("campaign_fields.campaign_name")}</Label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(event.target.value)
                }
                placeholder={t("placeholders.campaign_name_placeholder")}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : t("validation_messages.campaign_name_required"),
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null || value === "") {
                  return undefined;
                }
              }
              try {
                createCampaignInputSchema.shape.description.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("labels.description")}</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(e.target.value)
                }
                className="mt-1"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : t("validation_messages.description_required"),
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="gameSystemId"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null) {
                  return undefined;
                }
              }
              try {
                createCampaignInputSchema.shape.gameSystemId.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("campaign_fields.game_system_used")}</Label>
              {isGameSystemReadOnly ? (
                <p className="text-muted-foreground mt-1 text-sm">{gameSystemName}</p>
              ) : (
                <GameSystemCombobox
                  label="" // Label is already rendered above
                  options={gameSystemOptions}
                  placeholder={t("placeholders.search_and_select_game_system")}
                  value={field.state.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    const parsedValue = Number.parseInt(value, 10);
                    field.handleChange(
                      Number.isNaN(parsedValue) ? undefined : parsedValue,
                    );
                    // Find and store the selected game system details
                    const selectedId = Number.isNaN(parsedValue)
                      ? undefined
                      : parsedValue;
                    const selected =
                      selectedId !== undefined
                        ? (gameSystemResults.find((gs) => gs.id === selectedId) ?? null)
                        : null;
                    setSelectedGameSystem(selected || null);
                  }}
                  onSearchChange={setGameSystemSearchTerm}
                  isLoading={isLoadingGameSystems}
                  error={
                    field.state.meta.errors?.filter(Boolean).map((e) => {
                      if (typeof e === "string") {
                        return e;
                      } else if (e && typeof e === "object" && "message" in e) {
                        return (e as z.ZodIssue).message;
                      }
                      return ""; // Fallback for unexpected types
                    }) || []
                  }
                  data-testid="game-system-combobox"
                />
              )}
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : t("validation_messages.game_system_required"),
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="recurrence"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createCampaignInputSchema.shape.recurrence.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.recurrence")}</Label>
                <Select
                  value={field.state.value as string}
                  onValueChange={(value: "weekly" | "bi-weekly" | "monthly") =>
                    field.handleChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.select_recurrence")} />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignRecurrenceEnum.enumValues.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`status.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.recurrence_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="timeOfDay"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createCampaignInputSchema.shape.timeOfDay.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.time_of_day")}</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder={t("placeholders.time_of_day_placeholder")}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.time_of_day_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="sessionDuration"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createCampaignInputSchema.shape.sessionDuration.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>
                  {t("campaign_fields.session_duration_minutes")}
                </Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={
                    field.state.value
                      ? field.state.value
                      : (selectedGameSystem?.averagePlayTime ?? "")
                  }
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                  placeholder={t("placeholders.session_duration_placeholder")}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.session_duration_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="pricePerSession"
            validators={{
              onChange: ({ value }) => {
                try {
                  // Allow undefined or valid pricePerSession values (including zero)
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                  createCampaignInputSchema.shape.pricePerSession.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>
                  {t("campaign_fields.price_per_session_eur")}
                </Label>
                <div className="relative mt-1">
                  <span className="text-muted-foreground absolute inset-y-0 left-0 flex items-center pl-3">
                    €
                  </span>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(
                        event.target.value ? Number(event.target.value) : undefined,
                      )
                    }
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 pl-8 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.price_optional"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="language"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createCampaignInputSchema.shape.language.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.language")}</Label>
                <Select
                  value={field.state.value ?? ""}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.select_language")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.language_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="visibility"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createCampaignInputSchema.shape.visibility.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.visibility")}</Label>
                <Select
                  value={field.state.value as string}
                  onValueChange={(value: "public" | "protected" | "private") =>
                    field.handleChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.select_visibility")} />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityEnum.enumValues.map(
                      (v: (typeof visibilityEnum.enumValues)[number]) => (
                        <SelectItem key={v} value={v}>
                          {v === "protected"
                            ? t("status.connections_teammates")
                            : v.charAt(0).toUpperCase() + v.slice(1)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.visibility_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </FormSection>
      <p className="text-muted-foreground mt-2 text-sm">
        {t("descriptions.visibility_options")}
      </p>

      <FormSection
        title={t("form_sections.location")}
        description={t("descriptions.location_details")}
        contentClassName="space-y-6"
      >
        <form.Field
          name="location.address"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null) {
                  return undefined;
                }
              }
              try {
                locationSchema.shape.address.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("campaign_fields.address")}</Label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(event.target.value)
                }
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : t("validation_messages.address_required"),
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
        {/* Latitude and Longitude can be hidden or auto-filled by a map component */}
        <form.Field
          name="location.lat"
          validators={{
            onChange: ({ value }) => {
              // This field is optional, so undefined/null values are valid
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                locationSchema.shape.lat.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <input
              type="hidden"
              value={field.state.value || 0}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                field.handleChange(event.target.value ? Number(event.target.value) : 0)
              }
            />
          )}
        </form.Field>
        <form.Field
          name="location.lng"
          validators={{
            onChange: ({ value }) => {
              // This field is optional, so undefined/null values are valid
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                locationSchema.shape.lng.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <input
              type="hidden"
              value={field.state.value || 0}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                field.handleChange(event.target.value ? Number(event.target.value) : 0)
              }
            />
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title={t("form_sections.participant_requirements")}
        description={t("descriptions.participant_requirements")}
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="minimumRequirements.minPlayers"
            validators={{
              onChange: ({ value }) => {
                // This field is optional, so undefined/null values are valid
                if (value === undefined || value === null) {
                  return undefined;
                }
                try {
                  minimumRequirementsSchema.shape.minPlayers.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.minimum_players")}</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value ?? selectedGameSystem?.minPlayers ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value === "" ? 0 : Number(event.target.value),
                    )
                  }
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.min_players_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="minimumRequirements.maxPlayers"
            validators={{
              onChange: ({ value }) => {
                // This field is optional, so undefined/null values are valid
                if (value === undefined || value === null) {
                  return undefined;
                }
                try {
                  minimumRequirementsSchema.shape.maxPlayers.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("campaign_fields.maximum_players")}</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value ?? selectedGameSystem?.maxPlayers ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value === "" ? 0 : Number(event.target.value),
                    )
                  }
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : t("validation_messages.max_players_required"),
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </FormSection>

      <FormSection
        title={t("form_sections.safety_table_culture")}
        description={t("descriptions.safety_table_culture")}
        contentClassName="space-y-6"
      >
        <form.Field
          name="safetyRules.no-alcohol"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                safetyRulesSchema.shape["no-alcohol"].parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
              />
              <Label htmlFor={field.name}>{t("campaign_fields.no_alcohol")}</Label>
            </div>
          )}
        </form.Field>
        <form.Field
          name="safetyRules.safe-word"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                safetyRulesSchema.shape["safe-word"].parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
              />
              <Label htmlFor={field.name}>
                {t("campaign_fields.safe_word_required")}
              </Label>
            </div>
          )}
        </form.Field>
        <form.Field
          name="safetyRules.openCommunication"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null) return undefined;
              try {
                safetyRulesSchema.shape.openCommunication.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
              />
              <Label htmlFor={field.name}>
                {t("campaign_fields.encourage_open_communication")}
              </Label>
            </div>
          )}
        </form.Field>

        <div className="grid gap-6 md:grid-cols-2">
          <form.Field
            name="safetyRules.xCardSystem"
            validators={{
              onChange: ({ value }) => {
                if (value === undefined) return undefined;
                try {
                  safetyRulesSchema.shape.xCardSystem.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label>{t("campaign_fields.safety_tool")}</Label>
                <Select
                  value={(field.state.value as string | null) ?? "none"}
                  onValueChange={(v) =>
                    field.handleChange(
                      v === "none"
                        ? (null as z.infer<typeof xCardSystemEnum> | null)
                        : (v as z.infer<typeof xCardSystemEnum>),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("placeholders.safety_tool_placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {xCardSystemEnum.options.map(
                      (opt: z.infer<typeof xCardSystemEnum>) => (
                        <SelectItem key={opt} value={opt}>
                          {opt
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field
            name="safetyRules.xCardDetails"
            validators={{
              onChange: ({ value }) => {
                if (value === undefined) return undefined;
                try {
                  safetyRulesSchema.shape.xCardDetails.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).issues[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label>{t("campaign_fields.safety_tool_details_optional")}</Label>
                <Textarea
                  value={(field.state.value as string | null) ?? ""}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    field.handleChange(event.target.value || null)
                  }
                  onBlur={field.handleBlur}
                  placeholder={t("placeholders.safety_tool_placeholder")}
                  rows={3}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field
          name="safetyRules.playerBoundariesConsent"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined) return undefined;
              try {
                safetyRulesSchema.shape.playerBoundariesConsent.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).issues[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label>
                {t("campaign_fields.player_boundaries_consent_notes_optional")}
              </Label>
              <Textarea
                value={(field.state.value as string | null) ?? ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value || null)
                }
                onBlur={field.handleBlur}
                placeholder={t("placeholders.player_boundaries_consent_placeholder")}
                rows={3}
              />
            </div>
          )}
        </form.Field>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onCancelEdit ? (
          <Button variant="outline" onClick={onCancelEdit}>
            {t("buttons.cancel")}
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/player/campaigns">{t("buttons.cancel")}</Link>
          </Button>
        )}
        <FormSubmitButton isSubmitting={isSubmitting}>
          {initialValues ? t("buttons.update_campaign") : t("buttons.create_campaign")}
        </FormSubmitButton>
      </div>
    </form>
  );
}
