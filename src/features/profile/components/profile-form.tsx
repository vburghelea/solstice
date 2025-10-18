import { useAppForm } from "~/lib/form";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useProfileTranslation } from "~/hooks/useTypedTranslation";

import { updateUserProfile } from "../profile.mutations";
import { getUserGameSystemPreferences } from "../profile.queries";
import { profileInputSchema, ProfileInputType } from "../profile.schemas";
import type { ProfileOperationResult } from "../profile.types";

import { Route as RootRoute } from "~/routes/__root";
import { GamePreferencesStep } from "./game-preferences-step";

const defaultProfile: ProfileInputType = {
  gender: "",
  pronouns: "",
  phone: "",
  gameSystemPreferences: {
    favorite: [],
    avoid: [],
  },
  privacySettings: {
    showEmail: false,
    showPhone: false,
    showLocation: false,
    showLanguages: false,
    showGamePreferences: false,
    allowTeamInvitations: true,
    allowFollows: true,
    allowInvitesOnlyFromConnections: false,
  },
};

export function ProfileForm() {
  const { t } = useProfileTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = RootRoute.useRouteContext();

  const { data: gamePreferences } = useQuery({
    queryKey: ["user-game-preferences"],
    queryFn: () => getUserGameSystemPreferences(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      gender: user?.gender ?? "",
      pronouns: user?.pronouns ?? "",
      phone: user?.phone ?? "",
      gameSystemPreferences: {
        favorite: gamePreferences?.data?.favorite || [],
        avoid: gamePreferences?.data?.avoid || [],
      } as {
        favorite: { id: number; name: string }[];
        avoid: { id: number; name: string }[];
      },
      privacySettings: user?.privacySettings
        ? {
            ...defaultProfile.privacySettings,
            ...(JSON.parse(
              user.privacySettings as string,
            ) as ProfileInputType["privacySettings"]),
          }
        : defaultProfile.privacySettings,
    },
    validators: {
      onChange: ({ value }) => {
        const result = profileInputSchema.safeParse(value);
        if (!result.success) {
          return result.error.errors.map((err) => ({
            message: err.message,
            path: err.path.join("."),
          }));
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const basePrivacy = defaultProfile.privacySettings!;
        const sanitizedPrivacy = value.privacySettings
          ? {
              showEmail: value.privacySettings.showEmail ?? basePrivacy.showEmail,
              showPhone: value.privacySettings.showPhone ?? basePrivacy.showPhone,
              showLocation:
                value.privacySettings.showLocation ?? basePrivacy.showLocation,
              showLanguages:
                value.privacySettings.showLanguages ?? basePrivacy.showLanguages,
              showGamePreferences:
                value.privacySettings.showGamePreferences ??
                basePrivacy.showGamePreferences,
              allowTeamInvitations:
                value.privacySettings.allowTeamInvitations ??
                basePrivacy.allowTeamInvitations,
              allowFollows:
                value.privacySettings.allowFollows ?? basePrivacy.allowFollows,
              allowInvitesOnlyFromConnections:
                value.privacySettings.allowInvitesOnlyFromConnections ??
                basePrivacy.allowInvitesOnlyFromConnections,
            }
          : undefined;

        const payload: Partial<ProfileInputType> = {
          ...value,
          privacySettings: sanitizedPrivacy,
        };

        const result = await (
          updateUserProfile as unknown as (params: {
            data: Partial<ProfileInputType>;
          }) => Promise<ProfileOperationResult>
        )({
          data: payload,
        });

        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          router.invalidate();
        } else {
          const errorMessage =
            result.errors?.[0]?.message || t("errors.failed_to_save_profile");
          setError(errorMessage);
        }
      } catch (err) {
        setError(t("errors.unexpected_error"));
        console.error("Profile submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (user && gamePreferences?.success) {
      const parsedPrivacySettings = user.privacySettings
        ? JSON.parse(user.privacySettings)
        : {};
      const defaults = defaultProfile.privacySettings;
      if (!defaults) {
        return;
      }
      form.setFieldValue(
        "privacySettings.showEmail",
        parsedPrivacySettings.showEmail ?? defaults.showEmail,
      );
      form.setFieldValue(
        "privacySettings.showPhone",
        parsedPrivacySettings.showPhone ?? defaults.showPhone,
      );
      form.setFieldValue(
        "privacySettings.showLocation",
        parsedPrivacySettings.showLocation ?? defaults.showLocation,
      );
      form.setFieldValue(
        "privacySettings.showLanguages",
        parsedPrivacySettings.showLanguages ?? defaults.showLanguages,
      );
      form.setFieldValue(
        "privacySettings.showGamePreferences",
        parsedPrivacySettings.showGamePreferences ?? defaults.showGamePreferences,
      );
      form.setFieldValue(
        "privacySettings.allowTeamInvitations",
        parsedPrivacySettings.allowTeamInvitations ?? defaults.allowTeamInvitations,
      );
      form.setFieldValue(
        "privacySettings.allowFollows",
        parsedPrivacySettings.allowFollows ?? defaults.allowFollows,
      );
      form.setFieldValue(
        "privacySettings.allowInvitesOnlyFromConnections",
        parsedPrivacySettings.allowInvitesOnlyFromConnections ??
          defaults.allowInvitesOnlyFromConnections,
      );
    }
  }, [user, gamePreferences, form]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("personal_information.title")}</CardTitle>
            <CardDescription>{t("personal_information.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.AppField
              name="gender"
              children={(field) => (
                <field.ValidatedSelect
                  field={field}
                  label={t("optional_fields.gender")}
                  options={[
                    { value: "male", label: t("gender_options.male") },
                    { value: "female", label: t("gender_options.female") },
                    { value: "non-binary", label: t("gender_options.non_binary") },
                    { value: "other", label: t("gender_options.other") },
                    {
                      value: "prefer-not-to-say",
                      label: t("gender_options.prefer_not_to_say"),
                    },
                  ]}
                  placeholderText={t("placeholders.gender")}
                />
              )}
            />

            <form.AppField
              name="pronouns"
              children={(field) => (
                <field.ValidatedInput
                  field={field}
                  label={t("optional_fields.pronouns")}
                  placeholder={t("placeholders_optional.pronouns")}
                />
              )}
            />

            <form.AppField
              name="phone"
              children={(field) => (
                <field.ValidatedPhoneInput
                  field={field}
                  label={t("optional_fields.phone")}
                  placeholder={t("placeholders.phone_number")}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("form_steps.game_preferences.title")}</CardTitle>
            <CardDescription>
              {t("form_steps.game_preferences.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField
              name="gameSystemPreferences"
              children={(field) => (
                <GamePreferencesStep
                  initialFavorites={field.state.value?.favorite || []}
                  initialToAvoid={field.state.value?.avoid || []}
                  onPreferencesChange={(favorite, avoid) => {
                    field.handleChange({ favorite: favorite, avoid: avoid });
                  }}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("form_steps.privacy.title")}</CardTitle>
            <CardDescription>{t("form_steps.privacy.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.AppField
              name="privacySettings.showEmail"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label={t("privacy_options.show_email_to_teammates")}
                />
              )}
            />

            <form.AppField
              name="privacySettings.showPhone"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label={t("privacy_options.show_phone_to_teammates")}
                />
              )}
            />

            <form.AppField
              name="privacySettings.allowTeamInvitations"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label={t("privacy_options.allow_team_captains_invitations")}
                />
              )}
            />
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {t("buttons.saving")}
              </>
            ) : (
              t("buttons.save_changes")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
