import { createFileRoute } from "@tanstack/react-router";
import { CompleteProfileForm } from "~/features/profile/components/complete-profile-form-simple";
import { useProfileTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/player/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { t } = useProfileTranslation();
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("onboarding.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("onboarding.description")}</p>
      </div>
      <CompleteProfileForm />
    </div>
  );
}
