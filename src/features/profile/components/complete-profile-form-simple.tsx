import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedDatePicker } from "~/components/form-fields/ValidatedDatePicker";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { authQueryKey } from "~/features/auth/auth.queries";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { cn } from "~/shared/lib/utils";
import { completeUserProfile } from "../profile.mutations";
import type { ProfileInputType } from "../profile.schemas";
import type { ProfileInput, ProfileOperationResult } from "../profile.types";

const STEPS = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic information about you",
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    description: "Who should we contact in case of emergency",
  },
  {
    id: "privacy",
    title: "Privacy Settings",
    description: "Control what information is visible to others",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function CompleteProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      dateOfBirth: new Date(),
      gender: "",
      pronouns: "",
      phone: "",
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
        email: "",
      },
      privacySettings: {
        showEmail: false,
        showPhone: false,
        showBirthYear: false,
        allowTeamInvitations: true,
      },
    } as ProfileInputType,
    onSubmit: async ({ value }) => {
      if (currentStepIndex < STEPS.length - 1) {
        goToNextStep();
        return;
      }

      setError(null);

      try {
        // Build profile input with only defined values
        const dataToSubmit: ProfileInput = {
          dateOfBirth: value.dateOfBirth,
        };

        // Add optional fields only if they have values
        if (value.gender) dataToSubmit.gender = value.gender;
        if (value.pronouns) dataToSubmit.pronouns = value.pronouns;
        if (value.phone) dataToSubmit.phone = value.phone;
        if (value.privacySettings) dataToSubmit.privacySettings = value.privacySettings;

        // Only include emergency contact if it has meaningful data
        if (
          value.emergencyContact &&
          (value.emergencyContact.name ||
            value.emergencyContact.relationship ||
            value.emergencyContact.phone ||
            value.emergencyContact.email)
        ) {
          // Build emergency contact with required fields
          const emergencyContact: ProfileInput["emergencyContact"] = {
            name: value.emergencyContact.name || "",
            relationship: value.emergencyContact.relationship || "",
          };
          if (value.emergencyContact.phone)
            emergencyContact.phone = value.emergencyContact.phone;
          if (value.emergencyContact.email)
            emergencyContact.email = value.emergencyContact.email;

          dataToSubmit.emergencyContact = emergencyContact;
        }

        const result = (await unwrapServerFnResult(
          completeUserProfile({
            data: dataToSubmit,
          }),
        )) as ProfileOperationResult;

        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: authQueryKey });
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

  // Check if emergency contact has any data
  const emergencyContact = form.getFieldValue("emergencyContact");
  const hasEmergencyContactData =
    emergencyContact &&
    (emergencyContact.name ||
      emergencyContact.relationship ||
      emergencyContact.phone ||
      emergencyContact.email);

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
                <form.Field
                  name="dateOfBirth"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "Date of birth is required";
                      const age = new Date().getFullYear() - value.getFullYear();
                      if (age < 13 || age > 120) {
                        return "Age must be between 13 and 120 years";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedDatePicker
                      field={field}
                      label="Date of Birth"
                      minAge={13}
                      maxAge={120}
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
                    <ValidatedInput
                      field={field}
                      label="Phone Number (optional)"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                    />
                  )}
                </form.Field>
              </>
            )}

            {/* Emergency Contact Step */}
            {currentStep === "emergency" && (
              <>
                <p className="text-muted-foreground mb-4 text-sm">
                  Emergency contact information is optional but recommended for your
                  safety.
                </p>

                <form.Field name="emergencyContact.name">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Emergency Contact Name (optional)"
                      placeholder="Full name"
                    />
                  )}
                </form.Field>

                <form.Field name="emergencyContact.relationship">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Relationship"
                      placeholder="e.g., Parent, Spouse, Friend"
                      disabled={!hasEmergencyContactData}
                    />
                  )}
                </form.Field>

                <form.Field name="emergencyContact.phone">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Emergency Contact Phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      disabled={!hasEmergencyContactData}
                    />
                  )}
                </form.Field>

                <form.Field name="emergencyContact.email">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Emergency Contact Email"
                      type="email"
                      placeholder="email@example.com"
                      disabled={!hasEmergencyContactData}
                    />
                  )}
                </form.Field>

                {hasEmergencyContactData && (
                  <p className="text-muted-foreground text-sm">
                    If providing emergency contact, please include at least one contact
                    method (phone or email).
                  </p>
                )}
              </>
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

                  <form.Field name="privacySettings.showBirthYear">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Show my birth year on my profile"
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
