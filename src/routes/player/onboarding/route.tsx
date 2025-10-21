import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth } from "~/lib/auth/guards/route-guards";
import { resolveLocalizedPath } from "~/lib/i18n/redirects";

export const Route = createFileRoute("/player/onboarding")({
  beforeLoad: async ({ context, location }) => {
    requireAuth({ user: context.user, location, language: context.language });

    if (context.user?.profileComplete) {
      const localizedPlayerPath = resolveLocalizedPath({
        targetPath: "/player",
        language: context.language,
        currentPath: location.pathname,
      });
      throw redirect({ to: localizedPlayerPath } as never);
    }
  },
});
