import { createFileRoute } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";

export const Route = createFileRoute("/gm/collaboration")({
  component: GameMasterCollaborationView,
});

function GameMasterCollaborationView() {
  return <CrossPersonaCollaborationWorkspace activePersona="gm" />;
}
