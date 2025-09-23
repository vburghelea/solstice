import { useForm } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { sessionZeroSchema } from "~/features/campaigns/campaigns.schemas";
import { type SessionZeroDataType } from "../campaigns.types";

interface SessionZeroFormProps {
  initialValues: {
    sessionZeroData?: SessionZeroDataType | null;
    characterCreationOutcome?: string | null;
  };
  onSubmit: (values: {
    sessionZeroData?: z.infer<typeof sessionZeroSchema>;
    characterCreationOutcome?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  isOwner: boolean;
}

export function SessionZeroForm({
  initialValues,
  onSubmit,
  isSubmitting,
  isOwner,
}: SessionZeroFormProps) {
  const form = useForm({
    defaultValues: JSON.parse(JSON.stringify(initialValues)),
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Campaign Expectations */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          Campaign Expectations
        </legend>
        <form.Field name="sessionZeroData.campaignExpectations.style">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Campaign Style (e.g., High Fantasy, Dark & Gritty)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.campaignExpectations.difficulty">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Game Difficulty (e.g., Lethal, Forgiving)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.campaignExpectations.houseRules">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>House Rules / Homebrew Content</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.campaignExpectations.levelingUp">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Leveling Up Method (XP or Milestones)</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.campaignExpectations.campaignLength">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Campaign Length (e.g., One-shot, Long-running)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      {/* Table Expectations */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          Table Expectations
        </legend>
        <form.Field name="sessionZeroData.tableExpectations.foodDrinks">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Food and Drinks Policy</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.tableExpectations.nonTableActivities">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Non-Table Activities (e.g., Phone Use, Side Conversations)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.tableExpectations.diceRolls">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Unannounced Dice Rolls Policy</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.tableExpectations.pvp">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>PVP and Contested Rolls Policy</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.tableExpectations.characterSecrets">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Character Secrets Policy</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.tableExpectations.playerAbsences">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Player Absences Policy</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      {/* Safety Tools */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">Safety Tools</legend>
        <form.Field name="sessionZeroData.safetyTools.openCommunication">
          {(field) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
              <Label htmlFor={field.name}>Encourage Open Communication</Label>
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.safetyTools.xCardSystem">
          {(field) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
              <Label htmlFor={field.name}>Use X-Card System</Label>
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.safetyTools.xCardDetails">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>X-Card System Details (if applicable)</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.safetyTools.playerBoundariesConsent">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Player Boundaries and Consent Discussion</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      {/* Character Creation */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          Character Creation
        </legend>
        <form.Field name="sessionZeroData.characterCreation.creationQuestions">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Character Creation Questions (e.g., Starting Level, Equipment)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.characterCreation.featsAllowed">
          {(field) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
              <Label htmlFor={field.name}>Feats Allowed</Label>
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.characterCreation.statsDetermination">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                Stats Determination Method (e.g., Rolling, Point-Buy)
              </Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.characterCreation.contextIntegration">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Character Context and Integration</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      {/* Character Creation Outcome (separate text field) */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          Documented Character Creation Outcome
        </legend>
        <form.Field name="characterCreationOutcome">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Final Character Creation Decisions</Label>
              <Textarea
                id={field.name}
                value={field.state.value || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
                onBlur={field.handleBlur}
                disabled={!isOwner}
                rows={6}
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      {isOwner && (
        <div className="flex justify-end">
          <FormSubmitButton isSubmitting={isSubmitting}>
            Save Session Zero Details
          </FormSubmitButton>
        </div>
      )}
    </form>
  );
}
