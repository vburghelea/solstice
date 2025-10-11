import { createFileRoute } from "@tanstack/react-router";
import { CompleteProfileForm } from "~/features/profile/components/complete-profile-form-simple";

export const Route = createFileRoute("/player/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Player Profile</h1>
        <p className="text-muted-foreground mt-2">
          Provide these details to finish onboarding and unlock the player workspace.
        </p>
      </div>
      <CompleteProfileForm />
    </div>
  );
}
