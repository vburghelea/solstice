import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "~/features/layouts/app-layout";
import {
  getLatestPolicyDocument,
  listUserPolicyAcceptances,
} from "~/features/privacy/privacy.queries";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingLayout,
  beforeLoad: async ({ context }) => {
    // First check if user is authenticated
    if (!context.user) {
      throw redirect({ to: "/auth/login" });
    }

    // Check if user needs onboarding:
    // 1. Profile not complete, OR
    // 2. Privacy policy not accepted
    const profileComplete = context.user.profileComplete;

    // Check policy acceptance (server-side)
    let policyAccepted = true;
    if (typeof window === "undefined") {
      const policy = await getLatestPolicyDocument({ data: "privacy_policy" });
      if (policy) {
        const acceptances = await listUserPolicyAcceptances();
        policyAccepted = acceptances.some(
          (acceptance) => acceptance.policyId === policy.id,
        );
      }
    }

    // If both complete, redirect to dashboard
    if (profileComplete && policyAccepted) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function OnboardingLayout() {
  return <AppLayout />;
}
