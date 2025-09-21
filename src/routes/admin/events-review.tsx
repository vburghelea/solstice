import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/events-review")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/admin/events-review" });
  },
});
