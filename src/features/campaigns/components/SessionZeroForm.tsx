import { useForm } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { sessionZeroSchema } from "~/features/campaigns/campaigns.schemas";
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
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
  const { t } = useCampaignsTranslation();
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
          {t("session_zero.campaign_expectations.title")}
        </legend>
        <form.Field name="sessionZeroData.campaignExpectations.style">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.campaign_expectations.campaign_style")}
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
                {t("session_zero.campaign_expectations.game_difficulty")}
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
              <Label htmlFor={field.name}>
                {t("session_zero.campaign_expectations.house_rules")}
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
        <form.Field name="sessionZeroData.campaignExpectations.levelingUp">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.campaign_expectations.leveling_up_method")}
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
        <form.Field name="sessionZeroData.campaignExpectations.campaignLength">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.campaign_expectations.campaign_length")}
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
          {t("session_zero.table_expectations.title")}
        </legend>
        <form.Field name="sessionZeroData.tableExpectations.foodDrinks">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.food_drinks_policy")}
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
        <form.Field name="sessionZeroData.tableExpectations.nonTableActivities">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.non_table_activities")}
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
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.unannounced_dice_rolls_policy")}
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
        <form.Field name="sessionZeroData.tableExpectations.pvp">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.pvp_contested_rolls_policy")}
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
        <form.Field name="sessionZeroData.tableExpectations.characterSecrets">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.character_secrets_policy")}
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
        <form.Field name="sessionZeroData.tableExpectations.playerAbsences">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.table_expectations.player_absences_policy")}
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

      {/* Safety Tools */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          {t("session_zero.safety_tools.title")}
        </legend>
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
              <Label htmlFor={field.name}>
                {t("session_zero.safety_tools.encourage_open_communication")}
              </Label>
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
              <Label htmlFor={field.name}>
                {t("session_zero.safety_tools.use_x_card_system")}
              </Label>
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.safetyTools.xCardDetails">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.safety_tools.x_card_system_details")}
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
        <form.Field name="sessionZeroData.safetyTools.playerBoundariesConsent">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.safety_tools.player_boundaries_consent_discussion")}
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

      {/* Character Creation */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          {t("session_zero.character_creation.title")}
        </legend>
        <form.Field name="sessionZeroData.characterCreation.creationQuestions">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.character_creation.character_creation_questions")}
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
              <Label htmlFor={field.name}>
                {t("session_zero.character_creation.feats_allowed")}
              </Label>
            </div>
          )}
        </form.Field>
        <form.Field name="sessionZeroData.characterCreation.statsDetermination">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t("session_zero.character_creation.stats_determination_method")}
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
              <Label htmlFor={field.name}>
                {t("session_zero.character_creation.character_context_integration")}
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

      {/* Character Creation Outcome (separate text field) */}
      <fieldset className="space-y-4 rounded-md border p-4">
        <legend className="text-lg font-semibold text-gray-300">
          {t("session_zero.documented_character_creation_outcome.title")}
        </legend>
        <form.Field name="characterCreationOutcome">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>
                {t(
                  "session_zero.documented_character_creation_outcome.final_character_creation_decisions",
                )}
              </Label>
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
            {t("buttons.save_session_zero_details")}
          </FormSubmitButton>
        </div>
      )}
    </form>
  );
}
