import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/player/inbox")({
  component: PlayerInbox,
});

function PlayerInbox() {
  const { user } = Route.useRouteContext() as {
    user?: { name?: string | null } | null;
  };
  return <SharedInboxView persona="player" userName={user?.name ?? null} />;
}
