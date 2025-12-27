import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingPolicyStep } from "~/features/privacy/components/onboarding-policy-step";
import {
  getLatestPolicyDocument,
  listUserPolicyAcceptances,
} from "~/features/privacy/privacy.queries";
import { CompleteProfileForm } from "~/features/profile/components/complete-profile-form-simple";
import { cn } from "~/shared/lib/utils";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

type OnboardingStep = "policy" | "profile";

function OnboardingPage() {
  const { user } = useRouteContext({ from: "/onboarding/" });
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("policy");

  // Check if policy needs acceptance
  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ["privacy", "policy", "latest"],
    queryFn: () => getLatestPolicyDocument({ data: "privacy_policy" }),
  });

  const { data: acceptances = [], isLoading: acceptancesLoading } = useQuery({
    queryKey: ["privacy", "policy", "acceptances"],
    queryFn: () => listUserPolicyAcceptances(),
  });

  const isLoading = policyLoading || acceptancesLoading;
  const hasPolicyToAccept = policy !== null && policy !== undefined;
  const hasAcceptedPolicy = policy
    ? acceptances.some((acceptance) => acceptance.policyId === policy.id)
    : true;

  const profileComplete = user?.profileComplete ?? false;

  // Determine which steps are needed
  const needsPolicyStep = hasPolicyToAccept && !hasAcceptedPolicy;
  const needsProfileStep = !profileComplete;

  // If user has completed everything, redirect to dashboard
  useEffect(() => {
    if (!isLoading && !needsPolicyStep && !needsProfileStep) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoading, needsPolicyStep, needsProfileStep, navigate]);

  // Define steps based on what's needed
  const steps: { id: OnboardingStep; title: string; number: number }[] = [];
  let stepNumber = 1;

  if (needsPolicyStep) {
    steps.push({ id: "policy", title: "Privacy Policy", number: stepNumber++ });
  }
  if (needsProfileStep) {
    steps.push({ id: "profile", title: "Complete Profile", number: stepNumber });
  }

  // Determine effective step
  let effectiveStep: OnboardingStep;
  if (needsPolicyStep && currentStep === "policy") {
    effectiveStep = "policy";
  } else if (needsProfileStep) {
    effectiveStep = "profile";
  } else {
    // All done - will redirect via useEffect
    effectiveStep = "policy";
  }

  const handlePolicyComplete = () => {
    if (needsProfileStep) {
      setCurrentStep("profile");
    } else {
      // Profile already complete, go to dashboard
      navigate({ to: "/dashboard" });
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === effectiveStep);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Nothing to do - this should redirect via useEffect, but show loading in the meantime
  if (steps.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      {/* Step indicators - only show if more than one step */}
      {steps.length > 1 && (
        <div className="mb-8 flex justify-center gap-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  index <= currentStepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground",
                )}
              >
                {step.number}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Welcome message */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          {effectiveStep === "policy"
            ? needsProfileStep
              ? "Welcome!"
              : "Privacy Policy Update"
            : "Complete Your Profile"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {effectiveStep === "policy"
            ? needsProfileStep
              ? "Before we get started, please review and accept our privacy policy."
              : "Please review and accept our updated privacy policy to continue."
            : user?.name
              ? `Hi ${user.name.split(" ")[0]}, please complete your profile to continue.`
              : "Please provide the following information to complete your registration."}
        </p>
      </div>

      {/* Step content */}
      {effectiveStep === "policy" ? (
        <OnboardingPolicyStep onComplete={handlePolicyComplete} />
      ) : (
        <CompleteProfileForm />
      )}
    </div>
  );
}
