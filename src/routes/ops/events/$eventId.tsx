import { createFileRoute } from "@tanstack/react-router";

import { OpsEventDetail } from "~/features/ops/components/ops-event-detail";

export const Route = createFileRoute("/ops/events/$eventId")({
  component: OpsEventDetailRoute,
});

function OpsEventDetailRoute() {
  const { eventId } = Route.useParams();

  return <OpsEventDetail eventId={eventId} />;
}
