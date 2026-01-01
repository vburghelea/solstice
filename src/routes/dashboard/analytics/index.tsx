import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/analytics/explore" });
  },
});
