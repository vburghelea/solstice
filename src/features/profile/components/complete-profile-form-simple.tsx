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

const STEPS = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic information about you",
  },
  {
    id: "additional",
    title: "Additional Information",
    description: "More details about your gaming preferences and experience",
  },
  {
    id: "privacy",
    title: "Privacy Settings",
    description: "Control what information is visible to others",
  },
  {
    id: "game-preferences",
    title: "Game Preferences",
    description: "Select your favorite and least favorite game systems",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Helper function to determine which step a field belongs to
function getFieldStep(fieldPath: string): StepId | null {
  const personalFields = ["name", "gender", "pronouns", "phone", "city", "country"];
  const additionalFields = [
    "languages",
    "identityTags",
    "preferredGameThemes",
    "overallExperienceLevel",
    "calendarAvailability",
  ];
  const privacyFields = ["privacySettings"];
  const gamePreferenceFields = ["gameSystemPreferences"];

  const fieldName = fieldPath.split(".")[0];

  if (personalFields.includes(fieldName)) return "personal";
  if (additionalFields.includes(fieldName)) return "additional";
  if (privacyFields.some((f) => fieldPath.startsWith(f))) return "privacy";
  if (gamePreferenceFields.some((f) => fieldPath.startsWith(f)))
    return "game-preferences";

  return null;
}

interface ProfileFormInnerProps {
  initialData: UserProfile;
}

function ProfileFormInner({ initialData }: ProfileFormInnerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
          // Handle validation errors with step highlighting
          const errors = result.errors as ProfileError[]; // Use proper type
          if (errors && errors.length > 0) {
            const errorsByStep: Record<string, string[]> = {};
            const errorMessages: string[] = [];

            errors.forEach((error) => {
              if (error.field) {
                const step = getFieldStep(error.field);
                if (step) {
                  errorsByStep[step] = errorsByStep[step] || [];
                  errorsByStep[step].push(error.message || `Invalid ${error.field}`);
                } else {
                  errorMessages.push(error.message || `Invalid ${error.field}`);
                }
              } else {
                errorMessages.push(error.message || "Validation error");
              }
            });

            setValidationErrors(errorsByStep);
            setError(
              errorMessages.length > 0
                ? errorMessages.join("; ")
                : "Please fix the validation errors below.",
            );

            // Navigate to the first step with errors
            const firstErrorStep = Object.keys(errorsByStep)[0];
            if (firstErrorStep) {
              setCurrentStep(firstErrorStep as StepId);
            }
          } else {
            setError("Failed to save profile");
          }
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
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
          "Unable to verify profile name. Please try again.";
        updateNameFieldMeta([message], { isValidating: false });
        setNameAvailability(null);
        setError(message);
        return { success: false };
      }

      if (!result.data.available) {
        const message = "That profile name is already taken";
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
          : "Unable to verify profile name. Please try again.";
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
        const message = result.errors?.[0]?.message || "Failed to reserve profile name";
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
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
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
                      label="Profile Name"
                      placeholder="choose a unique username"
                      description="This name is public and must be unique. Use letters, numbers, periods, underscores, or hyphens."
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
                      label="Gender (optional)"
                      options={genderOptions}
                      placeholderText="Select gender"
                    />
                  )}
                </form.Field>

                <form.Field name="pronouns">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Pronouns (optional)"
                      placeholder="e.g., they/them, she/her, he/him"
                    />
                  )}
                </form.Field>

                <form.Field name="phone">
                  {(field) => (
                    <ValidatedPhoneInput
                      field={field}
                      label="Phone Number (optional)"
                      placeholder="+49 1512 3456789"
                    />
                  )}
                </form.Field>
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="City (optional)"
                      placeholder="Berlin"
                    />
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <ValidatedCountryCombobox
                      field={field}
                      label="Country (optional)"
                      placeholder="Search for a country"
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
                      <Label>Languages (optional)</Label>
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
                        placeholder="Add languages you speak"
                        availableSuggestions={mappedLanguageOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="identityTags">
                  {(field) => (
                    <div>
                      <Label>Identity Tags (optional)</Label>
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
                        placeholder="Add identity tags that represent you"
                        availableSuggestions={mappedIdentityTagOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="preferredGameThemes">
                  {(field) => (
                    <div>
                      <Label>Preferred Game Themes (optional)</Label>
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
                        placeholder="Add game themes you prefer"
                        availableSuggestions={mappedGameThemeOptions}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="overallExperienceLevel">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Overall Experience Level (optional)"
                      options={mappedExperienceLevelOptions}
                      placeholderText="Select your experience level"
                    />
                  )}
                </form.Field>

                <form.Field name="calendarAvailability">
                  {(field) => (
                    <div>
                      <Label>Calendar Availability (optional)</Label>
                      <p className="text-muted-foreground text-sm">
                        Click and drag to select your available time slots each week.
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
                    Choose what information other members can see about you.
                  </p>

                  <Separator />

                  <form.Field name="privacySettings.showEmail">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my email address to team members"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showPhone">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my phone number to team members"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLocation">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my location (city/country) to others"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLanguages">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my languages to others"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showGamePreferences">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my game preferences to others"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowTeamInvitations">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Allow team captains to send me invitations"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowInvitesOnlyFromConnections">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Only allow invites from connections"
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowFollows">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Allow others to follow me"
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
                Previous
              </button>

              {isLastStep ? (
                <FormSubmitButton
                  isSubmitting={form.state.isSubmitting}
                  loadingText="Completing Profile..."
                >
                  Complete Profile
                </FormSubmitButton>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="text-primary-foreground bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  Next
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
  const { data: userProfileData, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile({}),
  });

  if (isLoadingUserProfile) {
    return <div>Loading profile...</div>;
  }

  if (!userProfileData?.success || !userProfileData.data) {
    return <div>Failed to load profile. Please try again.</div>;
  }

  return <ProfileFormInner initialData={userProfileData.data} />;
}
