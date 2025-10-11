import { createFileRoute } from "@tanstack/react-router";

import { EventsReviewDashboard } from "~/features/admin/components/events-review-dashboard";

export const Route = createFileRoute("/admin/events-review")({
  component: EventsReviewDashboard,
});
