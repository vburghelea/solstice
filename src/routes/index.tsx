import { createFileRoute, redirect } from "@tanstack/react-router";
import { PublicPortalPage } from "~/features/dashboard";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => createPageHead("Home"),
  component: HomePage,
});

function HomePage() {
  return <PublicPortalPage />;
}
