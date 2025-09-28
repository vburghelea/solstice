import { useForm } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
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
import { searchGameSystems } from "~/features/games/games.queries";
import { useDebounce } from "~/shared/hooks/useDebounce";
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

  const [gameSystemSearchTerm, setGameSystemSearchTerm] = useState("");
  const debouncedGameSystemSearchTerm = useDebounce(gameSystemSearchTerm, 500);

  const { data: gameSystemSearchResults, isLoading: isLoadingGameSystems } = useQuery({
    queryKey: ["searchGameSystems", debouncedGameSystemSearchTerm],
    queryFn: () => searchGameSystems({ data: { query: debouncedGameSystemSearchTerm } }),
    enabled: debouncedGameSystemSearchTerm.length >= 3,
  });

  // State to store the selected game system details
  const [selectedGameSystem, setSelectedGameSystem] = useState<{
    id: number;
    name: string;
    averagePlayTime: number | null;
    minPlayers: number | null;
    maxPlayers: number | null;
  } | null>(null);

  const gameSystemOptions =
    gameSystemSearchResults?.success && gameSystemSearchResults.data
      ? gameSystemSearchResults.data.map((gs) => ({
          value: gs.id.toString(),
          label: gs.name,
        }))
      : [];

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
        title="Campaign overview"
        description="Share the essentials players need to understand your ongoing story."
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
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Campaign Name</Label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(event.target.value)
                }
                placeholder="Enter a compelling name for your planned campaign"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "The campaign name is what most players see first when looking for adventure, make sure it's compelling.",
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
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Description</Label>
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
                        : "Please add a campaign description that sets the tone for what players should expect.",
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
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Game System Used</Label>
              {isGameSystemReadOnly ? (
                <p className="text-muted-foreground mt-1 text-sm">{gameSystemName}</p>
              ) : (
                <GameSystemCombobox
                  label="" // Label is already rendered above
                  options={gameSystemOptions}
                  placeholder="Search and select the game system you want to use"
                  value={field.state.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    const parsedValue = parseInt(value);
                    field.handleChange(isNaN(parsedValue) ? undefined : parsedValue);
                    // Find and store the selected game system details
                    const selectedId = isNaN(parsedValue) ? undefined : parsedValue;
                    const selected =
                      gameSystemSearchResults?.success &&
                      gameSystemSearchResults.data &&
                      selectedId !== undefined
                        ? gameSystemSearchResults.data.find((gs) => gs.id === selectedId)
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
                        : "Please select a game system for your campaign.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Recurrence</Label>
                <Select
                  value={field.state.value as string}
                  onValueChange={(value: "weekly" | "bi-weekly" | "monthly") =>
                    field.handleChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignRecurrenceEnum.enumValues.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
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
                          : "Choose the recurrence for your campaign.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Time of Day</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="e.g., Evenings, Afternoons"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : "Specify the general time of day for your campaign sessions.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Session Duration (minutes)</Label>
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
                  placeholder="e.g., 180, 240"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-destructive mt-1 text-sm">
                    {field.state.meta.errors
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : "Specify the typical duration of a single session within the campaign.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Price per session (EUR) (optional)</Label>
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
                          : "If you want to add a cover charge for the campaign session, specify it here.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Language</Label>
                <Select
                  value={field.state.value ?? ""}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
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
                          : "Choose the primary language for communication within the campaign.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Visibility</Label>
                <Select
                  value={field.state.value as string}
                  onValueChange={(value: "public" | "protected" | "private") =>
                    field.handleChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityEnum.enumValues.map(
                      (v: (typeof visibilityEnum.enumValues)[number]) => (
                        <SelectItem key={v} value={v}>
                          {v === "protected"
                            ? "Connections & Teammates"
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
                          : "Pick a visibility value that allows you to find the right people efficiently.",
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
        Visibility options: Public (visible to everyone), Connections & Teammates (visible
        to your followers, the people you follow, and active teammates), Private (visible
        only to invited players)
      </p>

      <FormSection
        title="Location"
        description="Let players know where your group will gather."
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
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Address</Label>
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
                        : "Enter the address of the location where the campaign sessions will take place.",
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
                return (error as z.ZodError).errors[0]?.message;
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
                return (error as z.ZodError).errors[0]?.message;
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
        title="Participant requirements"
        description="Optional guidelines that help players gauge whether the campaign is a fit."
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Minimum Players</Label>
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
                          : "We need to know how many people are expected to participate.",
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Maximum Players</Label>
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
                          : "We need to know how many people are expected to participate.",
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
        title="Safety & table culture"
        description="Optional expectations to set the tone for how you'll play together."
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
                return (error as z.ZodError).errors[0]?.message;
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
              <Label htmlFor={field.name}>No Alcohol</Label>
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
                return (error as z.ZodError).errors[0]?.message;
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
              <Label htmlFor={field.name}>Safe Word Required</Label>
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
                return (error as z.ZodError).errors[0]?.message;
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
              <Label htmlFor={field.name}>Encourage Open Communication</Label>
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label>Safety Tool</Label>
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
                    <SelectValue placeholder="Select a safety tool" />
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
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label>Safety Tool Details (optional)</Label>
                <Textarea
                  value={(field.state.value as string | null) ?? ""}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    field.handleChange(event.target.value || null)
                  }
                  onBlur={field.handleBlur}
                  placeholder="Any specifics about the chosen safety tool"
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
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label>Player Boundaries / Consent Notes (optional)</Label>
              <Textarea
                value={(field.state.value as string | null) ?? ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value || null)
                }
                onBlur={field.handleBlur}
                placeholder="Any boundaries or consent notes players should be aware of"
                rows={3}
              />
            </div>
          )}
        </form.Field>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onCancelEdit ? (
          <Button variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/dashboard/campaigns">Cancel</Link>
          </Button>
        )}
        <FormSubmitButton isSubmitting={isSubmitting}>
          {initialValues ? "Update Campaign" : "Create Campaign"}
        </FormSubmitButton>
      </div>
    </form>
  );
}
