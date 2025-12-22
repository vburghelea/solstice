import { createFileRoute, redirect } from "@tanstack/react-router";
import { PublicPortalPage } from "~/features/dashboard";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: HomePage,
});

function HomePage() {
  return <PublicPortalPage />;
}
