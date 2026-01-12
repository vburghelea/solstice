import { createFileRoute, redirect } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/analytics/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/analytics/explore" });
  },
  head: () => createPageHead("Analytics"),
});
