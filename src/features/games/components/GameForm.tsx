import { useForm } from "@tanstack/react-form";
import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { DateTimePicker } from "~/components/form-fields/DateTimePicker";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import { gameStatusEnum, gameVisibilityEnum } from "~/db/schema/games.schema";
import { GameSystemCombobox } from "~/features/games/components/GameSystemCombobox";
import { searchGameSystems } from "~/features/games/games.queries";
import {
  createGameInputSchema,
  updateGameInputSchema,
} from "~/features/games/games.schemas";
import { useDebounce } from "~/shared/hooks/useDebounce";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import { Checkbox } from "~/shared/ui/checkbox";
import { Label } from "~/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui/select";
import { Textarea } from "~/shared/ui/textarea";

interface GameFormProps {
  initialValues?: z.infer<typeof updateGameInputSchema>;
  onSubmit: (
    values: z.infer<typeof createGameInputSchema> | z.infer<typeof updateGameInputSchema>,
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function GameForm({ initialValues, onSubmit, isSubmitting }: GameFormProps) {
  const form = useForm({
    defaultValues: initialValues || {
      gameSystemId: undefined,
      name: "",
      dateTime: new Date().toISOString(),
      description: "",
      expectedDuration: 1,
      price: undefined,
      language: "",
      location: { address: "", lat: 0, lng: 0 },
      minimumRequirements: {
        minPlayers: undefined,
        maxPlayers: undefined,
        languageLevel: undefined,
        playerRadiusKm: undefined,
      },
      safetyRules: {
        "no-alcohol": false,
        "safe-word": false,
      },
      visibility: "public",
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted with values:", value);
      try {
        console.log("Calling onSubmit prop");
        await onSubmit(
          value as
            | z.infer<typeof createGameInputSchema>
            | z.infer<typeof updateGameInputSchema>,
        );
        console.log("onSubmit prop completed");
      } catch (error) {
        console.error("Error in form onSubmit:", error);
      }
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
  React.useEffect(() => {
    if (selectedGameSystem) {
      form.setFieldValue("expectedDuration", selectedGameSystem.averagePlayTime || 1);
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Form onSubmit handler called");
        console.log("Form state:", form.state);
        console.log("Field meta:", form.state.fieldMeta);
        // Check for field errors
        Object.entries(form.state.fieldMeta).forEach(([fieldName, fieldMeta]) => {
          if (fieldMeta.errors && fieldMeta.errors.length > 0) {
            console.log(`Field ${fieldName} has errors:`, fieldMeta.errors);
          }
        });
        form.handleSubmit();
      }}
      className="space-y-6"
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
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter a compelling name for your planned game session"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {field.state.meta.errors?.length > 0 && (
              <p className="text-destructive mt-1 text-sm">
                {field.state.meta.errors
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
            {field.state.meta.errors?.length > 0 && (
              <p className="text-destructive mt-1 text-sm">
                {field.state.meta.errors
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
          <GameSystemCombobox
            label="Game System Used"
            options={gameSystemOptions}
            placeholder="Search and select the game system you want to use"
            value={field.state.value?.toString() ?? ""}
            onValueChange={(value) => {
              field.handleChange(parseInt(value));
              // Find and store the selected game system details
              const selected =
                gameSystemSearchResults?.success && gameSystemSearchResults.data
                  ? gameSystemSearchResults.data.find((gs) => gs.id === parseInt(value))
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
          />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                value={
                  field.state.value
                    ? field.state.value
                    : (selectedGameSystem?.averagePlayTime ?? "")
                }
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value ? Number(e.target.value) : undefined)
                }
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
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
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : undefined,
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                value={field.state.value || ""}
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
                if (value === undefined || value === null || value === "") {
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
                  {gameVisibilityEnum.enumValues.map((v) => (
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
                        : "Pick a visibility value that allows you to find the right people efficiently.",
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Visibility options: Public (visible to everyone), Protected (visible to logged-in
        users), Private (visible only to invited players)
      </p>

      {/* Minimum and Maximum Players */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                value={field.state.value || selectedGameSystem?.minPlayers || ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value ? Number(e.target.value) : undefined)
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
                value={field.state.value || selectedGameSystem?.maxPlayers || ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value ? Number(e.target.value) : undefined)
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

      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold">Location</legend>
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
                onChange={(e) => field.handleChange(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
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
              onChange={(e) =>
                field.handleChange(e.target.value ? Number(e.target.value) : undefined)
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
              onChange={(e) =>
                field.handleChange(e.target.value ? Number(e.target.value) : undefined)
              }
            />
          )}
        </form.Field>
      </fieldset>

      {initialValues && (
        <form.Field
          name="status"
          validators={{
            onChange: ({ value }) => {
              try {
                updateGameInputSchema.shape.status.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Status</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(value: "scheduled" | "canceled" | "completed") =>
                  field.handleChange(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {gameStatusEnum.enumValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
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
                        : "What organizational status does this event have?",
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
      )}

      <fieldset className="space-y-2 rounded-md border p-4">
        <legend className="text-lg font-semibold">Minimum Requirements (Optional)</legend>
        <form.Field
          name="minimumRequirements.languageLevel"
          validators={{
            onChange: ({ value }) => {
              // This field is optional, so undefined/null values are valid
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                minimumRequirementsSchema.shape.languageLevel.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Language Level</Label>
              <Select
                value={
                  field.state.value === undefined || field.state.value === null
                    ? ""
                    : (field.state.value as
                        | "beginner"
                        | "intermediate"
                        | "advanced"
                        | "fluent")
                }
                onValueChange={(value) =>
                  field.handleChange(
                    value as "beginner" | "intermediate" | "advanced" | "fluent",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a language level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="fluent">Fluent</SelectItem>
                </SelectContent>
              </Select>
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "Players should speak the game session language at least at this level to fit in.",
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <div className="mt-4"></div>
        <form.Field
          name="minimumRequirements.playerRadiusKm"
          validators={{
            onChange: ({ value }) => {
              // This field is optional, so undefined/null values are valid
              if (value === undefined || value === null) {
                return undefined;
              }
              try {
                minimumRequirementsSchema.shape.playerRadiusKm.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Player Distance Radius (km)</Label>
              <input
                id={field.name}
                name={field.name}
                type="range"
                min="1"
                max="10"
                value={field.state.value || 5}
                onChange={(e) =>
                  field.handleChange(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full"
              />
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>1 km</span>
                <span className="text-center">Selected: {field.state.value || 5} km</span>
                <span>10 km</span>
              </div>
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive mt-1 text-sm">
                  {field.state.meta.errors
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : "How far should players be from the location to be able to see this game?",
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </fieldset>

      <fieldset className="space-y-2 rounded-md border p-4">
        <legend className="text-lg font-semibold">Safety Rules (Optional)</legend>
        {/* This is a simple example, a more robust solution would involve dynamic fields */}
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
            <div className="flex items-center space-x-2">
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
            <div className="flex items-center space-x-2">
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
      </fieldset>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link to="/dashboard/games">Cancel</Link>
        </Button>
        <FormSubmitButton isSubmitting={isSubmitting}>
          {initialValues ? "Update Game" : "Create Game"}
        </FormSubmitButton>
      </div>
    </form>
  );
}
