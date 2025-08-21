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
import { experienceLevelOptions } from "~/shared/types/common";
import { TagInput } from "~/shared/ui/tag-input";
import { completeUserProfile } from "../profile.mutations";
import { getUserGameSystemPreferences } from "../profile.queries";
import type { ProfileInputType } from "../profile.schemas";
import type { ProfileInput } from "../profile.types";
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

export function CompleteProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileInputType>({
    gender: "",
    pronouns: "",
    phone: "",
    city: "",
    country: "",
    languages: [],
    identityTags: [],
    preferredGameThemes: [],
    overallExperienceLevel: undefined,
    calendarAvailability: defaultAvailabilityData,
    isGM: false,
    gmStyle: "",
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
    },
  });

  const { data: gamePreferencesData, isLoading: isLoadingGamePreferences } = useQuery({
    queryKey: ["userGameSystemPreferences"],
    queryFn: () => getUserGameSystemPreferences(),
  });

  const form = useForm({
    defaultValues: {
      ...formData,
      gameSystemPreferences: {
        favorite:
          gamePreferencesData?.data?.favorite ??
          formData.gameSystemPreferences?.favorite ??
          [],
        avoid:
          gamePreferencesData?.data?.avoid ?? formData.gameSystemPreferences?.avoid ?? [],
      },
    } as ProfileInputType,
    onSubmit: async ({ value }) => {
      if (currentStepIndex < STEPS.length - 1) {
        setFormData(value as ProfileInputType);
        goToNextStep();
        return;
      }

      setError(null);

      try {
        // Build profile input with only defined values
        const dataToSubmit: ProfileInput = {};

        // Add optional fields only if they have values
        if (value.gender) dataToSubmit.gender = value.gender;
        if (value.pronouns) dataToSubmit.pronouns = value.pronouns;
        if (value.phone) dataToSubmit.phone = value.phone;
        if (value.city) dataToSubmit.city = value.city;
        if (value.country) dataToSubmit.country = value.country;
        if (value.languages && value.languages.length > 0)
          dataToSubmit.languages = value.languages;
        if (value.identityTags && value.identityTags.length > 0)
          dataToSubmit.identityTags = value.identityTags;
        if (value.preferredGameThemes && value.preferredGameThemes.length > 0)
          dataToSubmit.preferredGameThemes = value.preferredGameThemes;
        if (value.overallExperienceLevel)
          dataToSubmit.overallExperienceLevel = value.overallExperienceLevel;
        if (value.calendarAvailability)
          dataToSubmit.calendarAvailability = value.calendarAvailability;
        if (value.isGM !== undefined) dataToSubmit.isGM = value.isGM;
        if (value.isGM && value.gmStyle) dataToSubmit.gmStyle = value.gmStyle;
        if (value.gameSystemPreferences)
          dataToSubmit.gameSystemPreferences = value.gameSystemPreferences;
        if (value.privacySettings) dataToSubmit.privacySettings = value.privacySettings;

        const result = await completeUserProfile({ data: dataToSubmit });

        if (result.success) {
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

  // Gender options for select component
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
          form.handleSubmit();
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
                      placeholder="e.g., Toronto"
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
                          field.state.value?.map((lang) => ({ id: lang, name: lang })) ||
                          []
                        }
                        onAddTag={(tag) => {
                          const newLanguages = [...(field.state.value || []), tag.name];
                          field.handleChange(newLanguages);
                        }}
                        onRemoveTag={(id) => {
                          const newLanguages = (field.state.value || []).filter(
                            (lang) => lang !== id,
                          );
                          field.handleChange(newLanguages);
                        }}
                        placeholder="Add languages you speak"
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
                          const newTags = [...(field.state.value || []), tag.name];
                          field.handleChange(newTags);
                        }}
                        onRemoveTag={(id) => {
                          const newTags = (field.state.value || []).filter(
                            (tag) => tag !== id,
                          );
                          field.handleChange(newTags);
                        }}
                        placeholder="Add identity tags that represent you"
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
                          const newThemes = [...(field.state.value || []), tag.name];
                          field.handleChange(newThemes);
                        }}
                        onRemoveTag={(id) => {
                          const newThemes = (field.state.value || []).filter(
                            (theme) => theme !== id,
                          );
                          field.handleChange(newThemes);
                        }}
                        placeholder="Add game themes you prefer"
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

                <form.Field name="isGM">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="I am a Game Master"
                      disabled={false}
                    />
                  )}
                </form.Field>

                <form.Subscribe selector={(state) => state.values.isGM}>
                  {(isGM) =>
                    isGM ? (
                      <form.Field name="gmStyle">
                        {(field) => (
                          <ValidatedInput
                            field={field}
                            label="GM Style (optional)"
                            placeholder="Describe your GM style"
                          />
                        )}
                      </form.Field>
                    ) : null
                  }
                </form.Subscribe>
              </div>
            )}

            {/* Game Preferences Step */}
            {currentStep === "game-preferences" &&
              (isLoadingGamePreferences ? (
                <div>Loading game preferences...</div>
              ) : (
                <GamePreferencesStep
                  initialFavorites={formData.gameSystemPreferences?.favorite || []}
                  initialToAvoid={formData.gameSystemPreferences?.avoid || []}
                  onPreferencesChange={(favorite, avoid) => {
                    form.setFieldValue("gameSystemPreferences", {
                      favorite,
                      avoid,
                    });
                  }}
                />
              ))}

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
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showPhone">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my phone number to team members"
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLocation">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my location (city/country) to others"
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLanguages">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my languages to others"
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showGamePreferences">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my game preferences to others"
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowTeamInvitations">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Allow team captains to send me invitations"
                        disabled={false}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowFollows">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Allow others to follow me"
                        disabled={false}
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
                  type="submit"
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
