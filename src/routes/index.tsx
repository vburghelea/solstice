import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { PublicPortalPage } from "~/features/dashboard";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Check if user is authenticated
    const user = await getCurrentUser();

    if (!user) {
      // Unauthenticated - show public portal page
      return null;
    }

    throw redirect({ to: "/dashboard" });
  },
  component: HomePage,
});

function HomePage() {
  return <PublicPortalPage />;
}
