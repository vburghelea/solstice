import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
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
import { completeUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { ProfileInputType } from "../profile.schemas";
import type { ProfileInput, UserProfile } from "../profile.types";
import { defaultPrivacySettings } from "../profile.types";
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

interface ProfileFormInnerProps {
  initialData: UserProfile;
}

function ProfileFormInner({ initialData }: ProfileFormInnerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [error, setError] = useState<string | null>(null);
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
      try {
        const result = await completeUserProfile({ data: value as ProfileInput });

        if (result.success) {
          // Invalidate all profile caches so subsequent profile views refetch fresh data
          await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
          if (result.data?.id) {
            await queryClient.invalidateQueries({
              queryKey: ["userProfile", result.data.id],
            });
          }
          // Also invalidate generic user info if used elsewhere in UI
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          router.navigate({ to: "/dashboard" });
        } else {
          const errorMessage = result.errors?.[0]?.message || "Failed to save profile";
          setError(errorMessage);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Profile submission error:", err);
      }
    },
  });

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const goToStep = (stepId: StepId) => setCurrentStep(stepId);
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
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
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors",
              index <= currentStepIndex ? "text-primary" : "text-muted-foreground",
              "hover:text-primary",
            )}
            type="button"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                index <= currentStepIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isLastStep) {
            form.handleSubmit();
          } else {
            goToNextStep();
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
                    <ValidatedInput
                      field={field}
                      label="Phone Number (optional)"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                    />
                  )}
                </form.Field>
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="City (optional)"
                      placeholder="e.g., Berlin"
                    />
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Country (optional)"
                      placeholder="e.g., Canada"
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
