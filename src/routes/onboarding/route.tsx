import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "~/features/layouts/admin-layout";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingLayout,
  beforeLoad: async ({ context }) => {
    // First check if user is authenticated
    if (!context.user) {
      throw redirect({ to: "/login" });
    }

    // Check if profile is already complete
    if (context.user.profileComplete) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function OnboardingLayout() {
  return <AdminLayout />;
}
