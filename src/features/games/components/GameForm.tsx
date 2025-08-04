import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { gameStatusEnum, gameVisibilityEnum } from "~/db/schema/games.schema";
import { searchGameSystems } from "~/features/games/games.queries";
import {
  createGameInputSchema,
  gameFormSchema,
  updateGameInputSchema,
} from "~/features/games/games.schemas";
import { useDebounce } from "~/shared/hooks/useDebounce";
import { Checkbox } from "~/shared/ui/checkbox";
import { Combobox } from "~/shared/ui/combobox";
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
    validators: {
      onSubmit: gameFormSchema.parse,
    },
    defaultValues: initialValues || {
      gameSystemId: 0,
      dateTime: "",
      description: "",
      expectedDuration: 1,
      price: 0,
      language: "",
      location: { address: "", lat: 0, lng: 0 },
      visibility: "public",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(
        value as
          | z.infer<typeof createGameInputSchema>
          | z.infer<typeof updateGameInputSchema>,
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

  const gameSystemOptions =
    gameSystemSearchResults?.success && gameSystemSearchResults.data
      ? gameSystemSearchResults.data.map((gs) => ({
          value: gs.id.toString(),
          label: gs.name,
        }))
      : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="gameSystemId"
        validators={{
          onChange: ({ value }) => {
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
          <Combobox
            label="Game System"
            options={gameSystemOptions}
            placeholder="Search for a game system"
            value={field.state.value?.toString() ?? ""}
            onValueChange={(value) => field.handleChange(parseInt(value))}
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
          onChange: createGameInputSchema.shape.dateTime,
        }}
      >
        {(field) => (
          <ValidatedInput field={field} label="Date and Time" type="datetime-local" />
        )}
      </form.Field>

      <form.Field
        name="description"
        validators={{
          onChange: createGameInputSchema.shape.description,
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
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="expectedDuration"
        validators={{
          onChange: ({ value }) => {
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
          <ValidatedInput field={field} label="Expected Duration (hours)" type="number" />
        )}
      </form.Field>

      <form.Field
        name="price"
        validators={{
          onChange: ({ value }) => {
            try {
              createGameInputSchema.shape.price.parse(value);
              return undefined;
            } catch (error: unknown) {
              return (error as z.ZodError).errors[0]?.message;
            }
          },
        }}
      >
        {(field) => (
          <ValidatedInput field={field} label="Price (optional)" type="number" />
        )}
      </form.Field>

      <form.Field
        name="language"
        validators={{
          onChange: ({ value }) => {
            try {
              createGameInputSchema.shape.language.parse(value);
              return undefined;
            } catch (error: unknown) {
              return (error as z.ZodError).errors[0]?.message;
            }
          },
        }}
      >
        {(field) => <ValidatedInput field={field} label="Language" type="text" />}
      </form.Field>

      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold">Location</legend>
        <form.Field
          name="location.address"
          validators={{
            onChange: ({ value }) => {
              try {
                createGameInputSchema.shape.location.shape.address.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => <ValidatedInput field={field} label="Address" type="text" />}
        </form.Field>
        {/* Latitude and Longitude can be hidden or auto-filled by a map component */}
        <form.Field name="location.lat">
          {(field) => <input type="hidden" value={field.state.value} />}
        </form.Field>
        <form.Field name="location.lng">
          {(field) => <input type="hidden" value={field.state.value} />}
        </form.Field>
      </fieldset>

      <form.Field
        name="visibility"
        validators={{
          onChange: ({ value }) => {
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
              onValueChange={(value: "public" | "private") => field.handleChange(value)}
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
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

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
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>
      )}

      <fieldset className="space-y-2 rounded-md border p-4">
        <legend className="text-lg font-semibold">Minimum Requirements (Optional)</legend>
        <form.Field
          name="minimumRequirements.language"
          validators={{
            onChange: ({ value }) => {
              try {
                gameFormSchema.shape.minimumRequirements
                  .unwrap()
                  .shape.language.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <ValidatedInput field={field} label="Required Language" type="text" />
          )}
        </form.Field>
        <form.Field
          name="minimumRequirements.minPlayers"
          validators={{
            onChange: ({ value }) => {
              try {
                gameFormSchema.shape.minimumRequirements
                  .unwrap()
                  .shape.minPlayers.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <ValidatedInput field={field} label="Minimum Players" type="number" />
          )}
        </form.Field>
        <form.Field
          name="minimumRequirements.maxPlayers"
          validators={{
            onChange: ({ value }) => {
              try {
                gameFormSchema.shape.minimumRequirements
                  .unwrap()
                  .shape.maxPlayers.parse(value);
                return undefined;
              } catch (error: unknown) {
                return (error as z.ZodError).errors[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <ValidatedInput field={field} label="Maximum Players" type="number" />
          )}
        </form.Field>
        <form.Field
          name="minimumRequirements.sameCity"
          validators={{
            onChange: ({ value }) => {
              try {
                gameFormSchema.shape.minimumRequirements
                  .unwrap()
                  .shape.sameCity.parse(value);
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
              <Label htmlFor={field.name}>Players must be from the same city</Label>
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
              try {
                z.boolean().parse(value);
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
              try {
                z.boolean().parse(value);
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

      <FormSubmitButton isSubmitting={isSubmitting}>
        {initialValues ? "Update Game" : "Create Game"}
      </FormSubmitButton>
    </form>
  );
}
