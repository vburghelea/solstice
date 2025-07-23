import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/utils";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";
import { Checkbox } from "~/shared/ui/checkbox";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui/select";
import { Separator } from "~/shared/ui/separator";
import { completeUserProfile } from "../profile.mutations";
import type { ProfileInputType } from "../profile.schemas";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProfileInputType>(() => ({
    dateOfBirth: new Date(),
    gender: "",
    pronouns: "",
    phone: "",
    emergencyContact: undefined,
    privacySettings: {
      showEmail: false,
      showPhone: false,
      showBirthYear: false,
      allowTeamInvitations: true,
    },
  }));

  // Track if emergency contact has been started
  const [emergencyContactStarted, setEmergencyContactStarted] = useState(false);

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStepIndex < STEPS.length - 1) {
      goToNextStep();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Clean up emergency contact if not filled
      const dataToSubmit = { ...formData };
      if (
        dataToSubmit.emergencyContact &&
        !dataToSubmit.emergencyContact.name &&
        !dataToSubmit.emergencyContact.relationship &&
        !dataToSubmit.emergencyContact.phone &&
        !dataToSubmit.emergencyContact.email
      ) {
        dataToSubmit.emergencyContact = undefined;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - TanStack Start server function type inference issue
      const result = await completeUserProfile({
        data: dataToSubmit,
      });

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
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStepIndex].title}</CardTitle>
            <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Information Step */}
            {currentStep === "personal" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={
                      formData.dateOfBirth
                        ? new Date(formData.dateOfBirth).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: e.target.value
                          ? new Date(e.target.value)
                          : new Date(),
                      }))
                    }
                    required
                  />
                  <p className="text-muted-foreground text-sm">
                    You must be between 13 and 120 years old
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (optional)</Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns (optional)</Label>
                  <Input
                    id="pronouns"
                    value={formData.pronouns || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pronouns: e.target.value }))
                    }
                    placeholder="e.g., they/them, she/her, he/him"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </>
            )}

            {/* Emergency Contact Step */}
            {currentStep === "emergency" && (
              <>
                <p className="text-muted-foreground mb-4 text-sm">
                  Emergency contact information is optional but recommended for your
                  safety.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="emergency-name">
                    Emergency Contact Name (optional)
                  </Label>
                  <Input
                    id="emergency-name"
                    value={formData.emergencyContact?.name || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmergencyContactStarted(true);
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          name: value,
                          relationship: prev.emergencyContact?.relationship || "",
                          phone: prev.emergencyContact?.phone || "",
                          email: prev.emergencyContact?.email || "",
                        },
                      }));
                    }}
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-relationship">Relationship</Label>
                  <Input
                    id="emergency-relationship"
                    value={formData.emergencyContact?.relationship || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          name: prev.emergencyContact?.name || "",
                          relationship: value,
                          phone: prev.emergencyContact?.phone || "",
                          email: prev.emergencyContact?.email || "",
                        },
                      }));
                    }}
                    placeholder="e.g., Parent, Spouse, Friend"
                    disabled={
                      !emergencyContactStarted && !formData.emergencyContact?.name
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency-phone"
                    type="tel"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          name: prev.emergencyContact?.name || "",
                          relationship: prev.emergencyContact?.relationship || "",
                          phone: value,
                          email: prev.emergencyContact?.email || "",
                        },
                      }));
                    }}
                    placeholder="+1 (555) 000-0000"
                    disabled={
                      !emergencyContactStarted && !formData.emergencyContact?.name
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-email">Emergency Contact Email</Label>
                  <Input
                    id="emergency-email"
                    type="email"
                    value={formData.emergencyContact?.email || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          name: prev.emergencyContact?.name || "",
                          relationship: prev.emergencyContact?.relationship || "",
                          phone: prev.emergencyContact?.phone || "",
                          email: value,
                        },
                      }));
                    }}
                    placeholder="email@example.com"
                    disabled={
                      !emergencyContactStarted && !formData.emergencyContact?.name
                    }
                  />
                </div>

                {emergencyContactStarted && (
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-email"
                      checked={formData.privacySettings?.showEmail || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings!,
                            showEmail: !!checked,
                          },
                        }))
                      }
                    />
                    <Label
                      htmlFor="show-email"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Show my email address to team members
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-phone"
                      checked={formData.privacySettings?.showPhone || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings!,
                            showPhone: !!checked,
                          },
                        }))
                      }
                    />
                    <Label
                      htmlFor="show-phone"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Show my phone number to team members
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-birth-year"
                      checked={formData.privacySettings?.showBirthYear || false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings!,
                            showBirthYear: !!checked,
                          },
                        }))
                      }
                    />
                    <Label
                      htmlFor="show-birth-year"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Show my birth year on my profile
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-invitations"
                      checked={formData.privacySettings?.allowTeamInvitations !== false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings!,
                            allowTeamInvitations: !!checked,
                          },
                        }))
                      }
                    />
                    <Label
                      htmlFor="allow-invitations"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Allow team captains to send me invitations
                    </Label>
                  </div>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Completing Profile...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
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
