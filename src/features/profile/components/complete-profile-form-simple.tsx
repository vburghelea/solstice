import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedCountryCombobox } from "~/components/form-fields/ValidatedCountryCombobox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import { useProfileTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";
import {
  experienceLevelOptions,
  gameThemeOptions,
  identityTagOptions,
  languageOptions,
} from "~/shared/types/common";
import { TagInput } from "~/shared/ui/tag-input";
import { invalidateProfileCaches } from "../profile.cache";
import { completeUserProfile, updateUserProfile } from "../profile.mutations";
import { checkProfileNameAvailability, getUserProfile } from "../profile.queries";
import { type CompleteProfileInputType, type ProfileInputType } from "../profile.schemas";
import type { ProfileError, UserProfile } from "../profile.types";
import { defaultPrivacySettings } from "../profile.types";
import {
  normalizeProfileName,
  sanitizeProfileName,
  validateProfileNameValue,
} from "../profile.utils";
import { AvailabilityEditor } from "./availability-editor";
import { GamePreferencesStep } from "./game-preferences-step";

interface ProfileFormInnerProps {
  initialData: UserProfile;
}

function ProfileFormInner({ initialData }: ProfileFormInnerProps) {
  const { t } = useProfileTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const STEPS = [
    {
      id: "personal",
      title: t("complete_profile_form.steps.personal_information.title"),
      description: t("complete_profile_form.steps.personal_information.description"),
    },
    {
      id: "additional",
      title: t("complete_profile_form.steps.additional_information.title"),
      description: t("complete_profile_form.steps.additional_information.description"),
    },
    {
      id: "privacy",
      title: t("complete_profile_form.steps.privacy_settings.title"),
      description: t("complete_profile_form.steps.privacy_settings.description"),
    },
    {
      id: "game-preferences",
      title: t("complete_profile_form.steps.game_preferences.title"),
      description: t("complete_profile_form.steps.game_preferences.description"),
    },
  ] as const;

  type StepId = (typeof STEPS)[number]["id"];

  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [nameAvailability, setNameAvailability] = useState<{
    normalizedName: string;
    available: boolean;
  } | null>(null);
  const initialNormalizedProfileName = normalizeProfileName(initialData.name ?? "");
  const [reservedName, setReservedName] = useState<string | null>(
    initialNormalizedProfileName ? initialNormalizedProfileName : null,
  );
  // Merge initial data with default privacy settings to ensure all required fields are present
  const formDefaultValues = {
    ...initialData,
    privacySettings: {
      ...defaultPrivacySettings,
      ...initialData.privacySettings,
    },
    gameSystemPreferences: {
      favorite: [],
      avoid: [],
      ...initialData.gameSystemPreferences,
    },
    calendarAvailability: initialData.calendarAvailability || defaultAvailabilityData,
  };

  const form = useForm({
    defaultValues: formDefaultValues as ProfileInputType,
    onSubmit: async ({ value }) => {
      setError(null);
      setValidationErrors({});

      try {
        const validation = await validateProfileName();
        if (!validation.success) {
          return;
        }

        const reserved = await reserveProfileName(
          validation.sanitizedName,
          validation.normalizedName,
        );
        if (!reserved) {
          return;
        }

        const payload = {
          ...value,
          name: validation.sanitizedName,
        } as CompleteProfileInputType;

        const result = await completeUserProfile({ data: payload });

        if (result.success) {
          await invalidateProfileCaches(queryClient, result.data?.id ?? initialData.id);
          router.navigate({ to: "/player" });
        } else {
          const errorMessage =
            result.errors?.[0]?.message ||
            t("complete_profile_form.errors.failed_to_save_profile");
          setError(errorMessage);
        }
      } catch (err) {
        setError(t("complete_profile_form.errors.unexpected_error"));
        console.error("Profile submission error:", err);
      }
    },
  });

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const updateNameFieldMeta = (errors: string[], extra?: { isValidating?: boolean }) => {
    form.setFieldMeta("name", (prev) => ({
      ...(prev ?? {}),
      isTouched: true,
      isBlurred: true,
      errors,
      ...(extra ?? {}),
    }));
  };

  const validateProfileName = async (): Promise<
    { success: true; sanitizedName: string; normalizedName: string } | { success: false }
  > => {
    const rawName = form.state.values.name ?? "";
    const validation = validateProfileNameValue(rawName);

    if (!validation.success) {
      updateNameFieldMeta([validation.error], { isValidating: false });
      setNameAvailability(null);
      setError(validation.error);
      return { success: false };
    }

    const sanitizedName = validation.value;
    const normalizedName = normalizeProfileName(sanitizedName);
    const initialNormalizedName = initialNormalizedProfileName;

    if (sanitizedName !== form.state.values.name) {
      form.setFieldValue("name", sanitizedName);
    }

    if (normalizedName === initialNormalizedName) {
      updateNameFieldMeta([], { isValidating: false });
      setNameAvailability({ normalizedName, available: true });
      setError(null);
      return { success: true, sanitizedName, normalizedName };
    }

    if (
      nameAvailability &&
      nameAvailability.available &&
      nameAvailability.normalizedName === normalizedName
    ) {
      updateNameFieldMeta([], { isValidating: false });
      setError(null);
      return { success: true, sanitizedName, normalizedName };
    }

    try {
      updateNameFieldMeta([], { isValidating: true });
      const result = await checkProfileNameAvailability({
        data: { name: sanitizedName },
      });

      if (!result.success) {
        const message =
          result.errors?.[0]?.message ||
          t("complete_profile_form.errors.unable_to_verify_profile_name");
        updateNameFieldMeta([message], { isValidating: false });
        setNameAvailability(null);
        setError(message);
        return { success: false };
      }

      if (!result.data.available) {
        const message = t("complete_profile_form.errors.profile_name_taken");
        updateNameFieldMeta([message], { isValidating: false });
        setNameAvailability({ normalizedName, available: false });
        setError(message);
        return { success: false };
      }

      updateNameFieldMeta([], { isValidating: false });
      setNameAvailability({ normalizedName, available: true });
      setError(null);
      return { success: true, sanitizedName, normalizedName };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("complete_profile_form.errors.unable_to_verify_profile_name");
      updateNameFieldMeta([message], { isValidating: false });
      setNameAvailability(null);
      setError(message);
      return { success: false };
    }
  };

  const reserveProfileName = async (
    sanitizedName: string,
    normalizedName: string,
  ): Promise<boolean> => {
    if (reservedName === normalizedName) {
      return true;
    }

    try {
      const result = await updateUserProfile({ data: { name: sanitizedName } });

      if (!result.success) {
        const message =
          result.errors?.[0]?.message ||
          t("complete_profile_form.errors.failed_to_reserve_profile_name");
        updateNameFieldMeta([message], { isValidating: false });
        setError(message);
        setNameAvailability(null);
        return false;
      }

      setReservedName(normalizedName);
      setNameAvailability({ normalizedName, available: true });
      setError(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reserve profile name";
      updateNameFieldMeta([message], { isValidating: false });
      setError(message);
      setNameAvailability(null);
      return false;
    }
  };

  const goToStep = async (stepId: StepId) => {
    if (currentStep === "personal" && stepId !== "personal") {
      const validation = await validateProfileName();
      if (!validation.success) {
        return;
      }
      const reserved = await reserveProfileName(
        validation.sanitizedName,
        validation.normalizedName,
      );
      if (!reserved) {
        return;
      }
    }

    setCurrentStep(stepId);
    // Clear general error when navigating, but keep validation errors for highlighting
    if (Object.keys(validationErrors).length === 0) {
      setError(null);
    }
  };

  const goToNextStep = async () => {
    if (currentStep === "personal") {
      const validation = await validateProfileName();
      if (!validation.success) {
        return;
      }
      const reserved = await reserveProfileName(
        validation.sanitizedName,
        validation.normalizedName,
      );
      if (!reserved) {
        return;
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setError(null);
      setValidationErrors({});
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const isLastStep = currentStepIndex === STEPS.length - 1;

  const genderOptions = [
    { value: "male", label: t("gender_options.male") },
    { value: "female", label: t("gender_options.female") },
    { value: "non-binary", label: t("gender_options.non_binary") },
    { value: "other", label: t("gender_options.other") },
    { value: "prefer-not-to-say", label: t("gender_options.prefer_not_to_say") },
  ];

  const mappedExperienceLevelOptions = experienceLevelOptions.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
  }));

  const mappedLanguageOptions = languageOptions.map((lang) => ({
    id: lang.value,
    name: lang.label,
  }));

  const mappedIdentityTagOptions = identityTagOptions.map((tag) => ({
    id: tag,
    name: tag,
  }));

  const mappedGameThemeOptions = gameThemeOptions.map((theme) => ({
    id: theme,
    name: theme,
  }));

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const hasErrors =
            validationErrors[step.id] && validationErrors[step.id].length > 0;
          return (
            <button
              key={step.id}
              onClick={() => void goToStep(step.id)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                hasErrors
                  ? "text-destructive"
                  : index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground",
                "hover:text-primary",
              )}
              type="button"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  hasErrors
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : index <= currentStepIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
              {hasErrors && (
                <span className="relative ml-1">
                  <span className="bg-destructive absolute inline-flex h-2 w-2 animate-ping rounded-full opacity-75"></span>
                  <span className="bg-destructive relative inline-flex h-2 w-2 rounded-full"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Validation errors by step */}
      {validationErrors[currentStep] && validationErrors[currentStep].length > 0 && (
        <div className="bg-destructive/10 border-destructive/20 rounded-md border p-4">
          <h4 className="text-destructive mb-2 font-medium">Please fix these errors:</h4>
          <ul className="text-destructive list-inside list-disc space-y-1 text-sm">
            {validationErrors[currentStep].map((errorMsg) => (
              <li key={errorMsg}>{errorMsg}</li>
            ))}
          </ul>
        </div>
      )}

      {error && Object.keys(validationErrors).length === 0 && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isLastStep) {
            form.handleSubmit();
          } else {
            await goToNextStep();
          }
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStepIndex].title}</CardTitle>
            <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Information Step */}
            {currentStep === "personal" && (
              <>
                <form.Field name="name">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("complete_profile_form.fields.profile_name.label")}
                      placeholder={t(
                        "complete_profile_form.fields.profile_name.placeholder",
                      )}
                      description={t(
                        "complete_profile_form.fields.profile_name.description",
                      )}
                      autoComplete="username"
                      maxLength={30}
                      required
                      disableWhileSubmitting={false}
                      onValueChange={(value) => {
                        const sanitizedValue = sanitizeProfileName(value);
                        setNameAvailability(null);
                        setError(null);
                        form.setFieldMeta("name", (prev) => ({
                          ...(prev ?? {}),
                          errors: [],
                          isValidating: false,
                        }));
                        field.handleChange(sanitizedValue);
                      }}
                      onBlurCapture={() => {
                        void validateProfileName();
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="gender">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label={t("complete_profile_form.fields.gender.label")}
                      options={genderOptions}
                      placeholderText={t(
                        "complete_profile_form.fields.gender.placeholder",
                      )}
                    />
                  )}
                </form.Field>

                <form.Field name="pronouns">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("complete_profile_form.fields.pronouns.label")}
                      placeholder={t("complete_profile_form.fields.pronouns.placeholder")}
                    />
                  )}
                </form.Field>

                <form.Field name="phone">
                  {(field) => (
                    <ValidatedPhoneInput
                      field={field}
                      label={t("complete_profile_form.fields.phone.label")}
                      placeholder={t("complete_profile_form.fields.phone.placeholder")}
                    />
                  )}
                </form.Field>
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("complete_profile_form.fields.city.label")}
                      placeholder={t("complete_profile_form.fields.city.placeholder")}
                    />
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <ValidatedCountryCombobox
                      field={field}
                      label={t("complete_profile_form.fields.country.label")}
                      placeholder={t("complete_profile_form.fields.country.placeholder")}
                      valueFormat="label"
                    />
                  )}
                </form.Field>
              </>
            )}

            {/* Additional Information Step */}
            {currentStep === "additional" && (
              <div className="space-y-4">
                <form.Field name="languages">
                  {(field) => (
                    <div>
                      <Label>{t("complete_profile_form.fields.languages.label")}</Label>
                      <TagInput
                        tags={
                          field.state.value?.map((lang) => ({
                            id: lang,
                            name:
                              mappedLanguageOptions.find((l) => l.id === lang)?.name ||
                              lang,
                          })) || []
                        }
                        onAddTag={(tag) => {
                          const newLanguages = [...(field.state.value || []), tag.id];
                          field.handleChange(newLanguages);
                        }}
                        onRemoveTag={(id) => {
                          const newLanguages = (field.state.value || []).filter(
                            (lang) => lang !== id,
                          );
                          field.handleChange(newLanguages);
                        }}
                        placeholder={t(
                          "complete_profile_form.fields.languages.placeholder",
                        )}
                        availableSuggestions={mappedLanguageOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="identityTags">
                  {(field) => (
                    <div>
                      <Label>
                        {t("complete_profile_form.fields.identity_tags.label")}
                      </Label>
                      <TagInput
                        tags={
                          field.state.value?.map((tag) => ({ id: tag, name: tag })) || []
                        }
                        onAddTag={(tag) => {
                          const newTags = [...(field.state.value || []), tag.id];
                          field.handleChange(newTags);
                        }}
                        onRemoveTag={(id) => {
                          const newTags = (field.state.value || []).filter(
                            (tag) => tag !== id,
                          );
                          field.handleChange(newTags);
                        }}
                        placeholder={t(
                          "complete_profile_form.fields.identity_tags.placeholder",
                        )}
                        availableSuggestions={mappedIdentityTagOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="preferredGameThemes">
                  {(field) => (
                    <div>
                      <Label>
                        {t("complete_profile_form.fields.preferred_game_themes.label")}
                      </Label>
                      <TagInput
                        tags={
                          field.state.value?.map((theme) => ({
                            id: theme,
                            name: theme,
                          })) || []
                        }
                        onAddTag={(tag) => {
                          const newThemes = [...(field.state.value || []), tag.id];
                          field.handleChange(newThemes);
                        }}
                        onRemoveTag={(id) => {
                          const newThemes = (field.state.value || []).filter(
                            (theme) => theme !== id,
                          );
                          field.handleChange(newThemes);
                        }}
                        placeholder={t(
                          "complete_profile_form.fields.preferred_game_themes.placeholder",
                        )}
                        availableSuggestions={mappedGameThemeOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="overallExperienceLevel">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label={t("complete_profile_form.fields.experience_level.label")}
                      options={mappedExperienceLevelOptions}
                      placeholderText={t(
                        "complete_profile_form.fields.experience_level.placeholder",
                      )}
                    />
                  )}
                </form.Field>

                <form.Field name="calendarAvailability">
                  {(field) => (
                    <div>
                      <Label>
                        {t("complete_profile_form.fields.calendar_availability.label")}
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        {t(
                          "complete_profile_form.fields.calendar_availability.description",
                        )}
                      </p>
                      <AvailabilityEditor
                        value={field.state.value ?? defaultAvailabilityData}
                        onChange={field.handleChange}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            )}

            {/* Game Preferences Step */}
            {currentStep === "game-preferences" && (
              <GamePreferencesStep
                initialFavorites={form.state.values.gameSystemPreferences?.favorite || []}
                initialToAvoid={form.state.values.gameSystemPreferences?.avoid || []}
                onPreferencesChange={(favorite, avoid) => {
                  form.setFieldValue("gameSystemPreferences", {
                    favorite,
                    avoid,
                  });
                }}
              />
            )}

            {/* Privacy Settings Step */}
            {currentStep === "privacy" && (
              <>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    {t("complete_profile_form.privacy_settings_intro")}
                  </p>

                  <Separator />

                  <form.Field name="privacySettings.showEmail">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.show_email_to_team_members",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showPhone">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.show_phone_to_team_members",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLocation">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.show_location_to_others",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLanguages">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.show_languages_to_others",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showGamePreferences">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.show_game_preferences_to_others",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowTeamInvitations">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.allow_team_invitations",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowInvitesOnlyFromConnections">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.only_allow_invites_from_connections",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowFollows">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "complete_profile_form.privacy_checkboxes.allow_follows",
                        )}
                      />
                    )}
                  </form.Field>
                </div>
              </>
            )}

            <Separator />

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  currentStepIndex === 0
                    ? "invisible"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground border",
                )}
              >
                {t("complete_profile_form.navigation.previous")}
              </button>

              {isLastStep ? (
                <FormSubmitButton
                  isSubmitting={form.state.isSubmitting}
                  loadingText={t("complete_profile_form.navigation.completing_profile")}
                >
                  {t("complete_profile_form.navigation.complete_profile")}
                </FormSubmitButton>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="text-primary-foreground bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  {t("complete_profile_form.navigation.next")}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export function CompleteProfileForm() {
  const { t } = useProfileTranslation();
  const { data: userProfileData, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile({}),
  });

  if (isLoadingUserProfile) {
    return <div>{t("complete_profile_form.loading_profile")}</div>;
  }

  if (!userProfileData?.success || !userProfileData.data) {
    return <div>{t("complete_profile_form.failed_to_load_profile")}</div>;
  }

  return <ProfileFormInner initialData={userProfileData.data} />;
}
