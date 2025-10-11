import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/player/onboarding")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/login" });
    }

    if (context.user.profileComplete) {
      throw redirect({ to: "/player" });
    }
  },
});
