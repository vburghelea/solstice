import { useForm } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { DateTimePicker } from "~/components/form-fields/DateTimePicker";
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
import { visibilityEnum } from "~/db/schema/shared.schema";
import { GameSystemCombobox } from "~/features/games/components/GameSystemCombobox";
import {
  createGameInputSchema,
  updateGameInputSchema,
} from "~/features/games/games.schemas";
import { useGameSystemSearch } from "~/features/games/hooks/useGameSystemSearch";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
  xCardSystemEnum,
} from "~/shared/schemas/common";
import { FormSection } from "~/shared/ui/form-section";

type GameSystemSummary = {
  id: number;
  name: string;
  averagePlayTime: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
};

interface ValidationError {
  code: string;
  expected?: string;
  received?: string;
  path: string[];
  message: string;
  minimum?: number;
  type?: string;
  inclusive?: boolean;
  exact?: boolean;
}

interface GameFormProps {
  initialValues?: Partial<z.infer<typeof updateGameInputSchema>>;
  onSubmit: (
    values: z.infer<typeof createGameInputSchema> | z.infer<typeof updateGameInputSchema>,
  ) => Promise<void>;
  isSubmitting: boolean;
  isCampaignGame?: boolean;
  gameSystemName?: string;
  onCancelEdit?: () => void;
  serverErrors?: ValidationError[] | string | null;
}

export function GameForm({
  initialValues,
  onSubmit,
  isSubmitting,
  isCampaignGame,
  gameSystemName,
  onCancelEdit,
  serverErrors,
}: GameFormProps) {
  const defaults = {
    gameSystemId: initialValues?.gameSystemId,
    name: initialValues?.name ?? "",
    dateTime: initialValues?.dateTime ?? new Date().toISOString(),
    description: initialValues?.description ?? "",
    expectedDuration: initialValues?.expectedDuration,
    price: initialValues?.price ?? 0,
    language: initialValues?.language ?? "en",
    location: initialValues?.location ?? { address: "", lat: 0, lng: 0 },
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
    visibility: initialValues?.visibility ?? "public",
    status: initialValues?.status ?? "scheduled",
  } as const;

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(
          value as
            | z.infer<typeof createGameInputSchema>
            | z.infer<typeof updateGameInputSchema>,
        );
      } catch (error) {
        console.error("Error in form onSubmit:", error);
      }
    },
  });

  const {
    setSearchTerm: setGameSystemSearchTerm,
    results: gameSystemResults,
    options: baseGameSystemOptions,
    isLoading: isLoadingGameSystems,
  } = useGameSystemSearch({ enabled: !isCampaignGame });

  // State to store the selected game system details
  const [userSelectedGameSystem, setUserSelectedGameSystem] = useState<{
    id: number;
    name: string;
    averagePlayTime: number | null;
    minPlayers: number | null;
    maxPlayers: number | null;
  } | null>(null);

  const initialExpectedDuration = initialValues?.expectedDuration ?? null;
  const initialMinPlayers = initialValues?.minimumRequirements?.minPlayers ?? null;
  const initialMaxPlayers = initialValues?.minimumRequirements?.maxPlayers ?? null;
  const trimmedCampaignSystemName = gameSystemName?.trim() ?? "";
  const shouldPrefetchCampaignSystem = Boolean(
    isCampaignGame &&
      defaults.gameSystemId &&
      trimmedCampaignSystemName.length >= 3 &&
      (initialExpectedDuration == null ||
        initialMinPlayers == null ||
        initialMaxPlayers == null),
  );

  const fallbackCampaignGameSystem = React.useMemo(() => {
    if (
      !isCampaignGame ||
      !defaults.gameSystemId ||
      !gameSystemName ||
      trimmedCampaignSystemName.length < 1
    ) {
      return null;
    }

    return {
      id: defaults.gameSystemId,
      name: gameSystemName,
      averagePlayTime: initialExpectedDuration,
      minPlayers: initialMinPlayers,
      maxPlayers: initialMaxPlayers,
    } satisfies GameSystemSummary;
  }, [
    defaults.gameSystemId,
    gameSystemName,
    initialExpectedDuration,
    initialMaxPlayers,
    initialMinPlayers,
    isCampaignGame,
    trimmedCampaignSystemName,
  ]);

  const { data: campaignGameSystemData } = useQuery<GameSystemSummary | null>({
    queryKey: ["gameSystemById", defaults.gameSystemId, trimmedCampaignSystemName],
    queryFn: async () => {
      if (!defaults.gameSystemId) {
        return null;
      }

      const { searchGameSystems } = await import("~/features/games/games.queries");
      const response = await searchGameSystems({
        data: { query: trimmedCampaignSystemName },
      });

      if (!response.success) {
        throw new Error(response.errors?.[0]?.message ?? "Failed to fetch game system");
      }

      return response.data.find((system) => system.id === defaults.gameSystemId) ?? null;
    },
    enabled: shouldPrefetchCampaignSystem,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Derive effective game system (campaign-provided or user selection)
  const effectiveGameSystem = React.useMemo(() => {
    if (isCampaignGame) {
      if (campaignGameSystemData) {
        return campaignGameSystemData;
      }

      if (fallbackCampaignGameSystem) {
        return fallbackCampaignGameSystem;
      }
    }

    return userSelectedGameSystem;
  }, [
    campaignGameSystemData,
    fallbackCampaignGameSystem,
    isCampaignGame,
    userSelectedGameSystem,
  ]);

  const gameSystemOptions =
    isCampaignGame && initialValues?.gameSystemId && gameSystemName
      ? [{ value: initialValues.gameSystemId.toString(), label: gameSystemName }]
      : baseGameSystemOptions;

  // Update form fields when game system changes
  React.useEffect(() => {
    if (effectiveGameSystem) {
      if (!isCampaignGame || initialExpectedDuration == null) {
        form.setFieldValue("expectedDuration", effectiveGameSystem.averagePlayTime ?? 1);
      }

      if (initialMinPlayers == null) {
        form.setFieldValue(
          "minimumRequirements.minPlayers",
          effectiveGameSystem.minPlayers ?? 1,
        );
      }

      if (initialMaxPlayers == null) {
        form.setFieldValue(
          "minimumRequirements.maxPlayers",
          effectiveGameSystem.maxPlayers ?? 1,
        );
      }
    }
  }, [
    effectiveGameSystem,
    form,
    initialExpectedDuration,
    initialMaxPlayers,
    initialMinPlayers,
    isCampaignGame,
  ]);

  // Most spoken languages in the world
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "zh", label: "Chinese" },
    { value: "hi", label: "Hindi" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "ar", label: "Arabic" },
    { value: "bn", label: "Bengali" },
    { value: "ru", label: "Russian" },
  ];

  // Parse server errors and map them to field paths
  const getServerErrorsForField = (fieldPath: string): string[] => {
    if (!serverErrors) return [];

    let errors: ValidationError[];

    if (typeof serverErrors === "string") {
      try {
        const parsed = JSON.parse(serverErrors);
        errors = Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    } else if (Array.isArray(serverErrors)) {
      errors = serverErrors;
    } else {
      return [];
    }

    return errors
      .filter((error) => {
        // Match field paths (e.g., "name", "location.address", "minimumRequirements.minPlayers")
        const errorPath = error.path.join(".");
        return errorPath === fieldPath || errorPath.startsWith(fieldPath + ".");
      })
      .map((error) => error.message);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <FormSection
        title="Session overview"
        description="Share the essentials players need before they RSVP."
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
                  ? updateGameInputSchema
                  : createGameInputSchema;
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
              <Label htmlFor={field.name}>Game Session Name</Label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(event.target.value)
                }
                placeholder="Enter a compelling name for your planned game session"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {(field.state.meta.errors?.length > 0 ||
                getServerErrorsForField("name").length > 0) && (
                <p className="text-destructive mt-1 text-sm">
                  {[
                    ...(field.state.meta.errors || []),
                    ...getServerErrorsForField("name"),
                  ]
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "The game session name is what most players see first when looking for adventure, make sure it's compelling.",
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
                createGameInputSchema.shape.description.parse(value);
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
              {(field.state.meta.errors?.length > 0 ||
                getServerErrorsForField("description").length > 0) && (
                <p className="text-destructive mt-1 text-sm">
                  {[
                    ...(field.state.meta.errors || []),
                    ...getServerErrorsForField("description"),
                  ]
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "Please add a game session description that sets the tone for what players should expect.",
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
                createGameInputSchema.shape.gameSystemId.parse(value);
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
              {isCampaignGame ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  {gameSystemName && gameSystemName.trim().length > 0
                    ? gameSystemName
                    : effectiveGameSystem?.name || ""}
                </p>
              ) : (
                <GameSystemCombobox
                  label="" // Label is already rendered above
                  options={gameSystemOptions}
                  placeholder="Search and select the game system you want to use"
                  value={field.state.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    const parsedValue = Number.parseInt(value, 10);
                    field.handleChange(
                      Number.isNaN(parsedValue) ? undefined : parsedValue,
                    );
                    // Find and store the selected game system details
                    const selected = Number.isNaN(parsedValue)
                      ? null
                      : (gameSystemResults.find((system) => system.id === parsedValue) ??
                        null);
                    setUserSelectedGameSystem(selected);
                  }}
                  onSearchChange={setGameSystemSearchTerm}
                  isLoading={isLoadingGameSystems}
                  disabled={!!isCampaignGame}
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
                />
              )}
              {(field.state.meta.errors?.length > 0 ||
                getServerErrorsForField("gameSystemId").length > 0) && (
                <p className="text-destructive mt-1 text-sm">
                  {[
                    ...(field.state.meta.errors || []),
                    ...getServerErrorsForField("gameSystemId"),
                  ]
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "Please select a game system for your session.",
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="dateTime"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null || value === "") {
                  return undefined;
                }
              }
              try {
                createGameInputSchema.shape.dateTime.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => <DateTimePicker field={field} label="Date and Time" />}
        </form.Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="expectedDuration"
            validators={{
              onChange: ({ value }) => {
                if (initialValues) {
                  // For update form, field is optional
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                }
                try {
                  createGameInputSchema.shape.expectedDuration.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Expected Duration (minutes)</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value ?? effectiveGameSystem?.averagePlayTime ?? 1}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : 0,
                    )
                  }
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {(field.state.meta.errors?.length > 0 ||
                  getServerErrorsForField("expectedDuration").length > 0) && (
                  <p className="text-destructive mt-1 text-sm">
                    {[
                      ...(field.state.meta.errors || []),
                      ...getServerErrorsForField("expectedDuration"),
                    ]
                      .map((error) =>
                        typeof error === "string"
                          ? error
                          : "Enter a game duration in minutes to let others know how much time to reserve for this.",
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) => {
                try {
                  // Allow undefined or valid price values (including zero)
                  if (value === undefined || value === null) {
                    return undefined;
                  }
                  createGameInputSchema.shape.price.parse(value);
                  return undefined;
                } catch (error: unknown) {
                  return (error as z.ZodError).errors[0]?.message;
                }
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Price (EUR) (optional)</Label>
                <div className="relative mt-1">
                  <span className="text-muted-foreground absolute inset-y-0 left-0 flex items-center pl-3">
                    €
                  </span>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(
                        event.target.value ? Number(event.target.value) : 0,
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
                          : "If you want to add a cover charge for the game, specify it here.",
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
                  if (value === undefined || value === null || value === "") {
                    return undefined;
                  }
                }
                try {
                  createGameInputSchema.shape.language.parse(value);
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
                  value={field.state.value as string}
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
                          : "Choose the language that the game system you chose will be played in.",
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
                  createGameInputSchema.shape.visibility.parse(value);
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
        <p className="text-muted-foreground text-sm">
          Visibility options: Public (visible to everyone), Connections & Teammates
          (visible to your followers, the people you follow, and active teammates),
          Private (visible only to invited players)
        </p>
      </FormSection>

      {/* Minimum and Maximum Players */}
      <FormSection
        title="Participant requirements"
        description="Optional guidelines that help players self-select into the right tables."
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
                  value={field.state.value ?? effectiveGameSystem?.minPlayers ?? 1}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : 0,
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
                  value={field.state.value ?? effectiveGameSystem?.maxPlayers ?? 1}
                  onBlur={field.handleBlur}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : 0,
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
        title="Location"
        description="Let players know where the session will take place."
        contentClassName="space-y-6"
      >
        <form.Field
          name="location.address"
          validators={{
            onChange: ({ value }) => {
              if (initialValues) {
                // For update form, field is optional
                if (value === undefined || value === null || value === "") {
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
              {(field.state.meta.errors?.length > 0 ||
                getServerErrorsForField("location.address").length > 0) && (
                <p className="text-destructive mt-1 text-sm">
                  {[
                    ...(field.state.meta.errors || []),
                    ...getServerErrorsForField("location.address"),
                  ]
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "Enter the address of the location where the game session will take place.",
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
                field.handleChange(Number(event.target.value))
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
                field.handleChange(Number(event.target.value))
              }
            />
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Safety & table culture"
        description="Optional expectations that set the tone for how you'll play together."
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
            <Link to="/player/games">Cancel</Link>
          </Button>
        )}
        <FormSubmitButton isSubmitting={isSubmitting}>
          {initialValues?.id ? "Update Game" : "Create Game"}
        </FormSubmitButton>
      </div>
    </form>
  );
}
