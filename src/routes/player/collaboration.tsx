import { createFileRoute } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";

export const Route = createFileRoute("/player/collaboration")({
  component: PlayerCollaborationView,
});

function PlayerCollaborationView() {
  const { user } = Route.useRouteContext() as {
    user?: { name?: string | null } | null;
  };
  return (
    <CrossPersonaCollaborationWorkspace
      activePersona="player"
      userName={user?.name ?? null}
    />
  );
}
