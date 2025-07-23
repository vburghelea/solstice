import { createFileRoute } from "@tanstack/react-router";
import { CompleteProfileForm } from "~/features/profile/components/complete-profile-form-simple";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Please provide the following information to complete your membership
          registration.
        </p>
      </div>
      <CompleteProfileForm />
    </div>
  );
}
