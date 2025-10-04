import { createFileRoute } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";

export const Route = createFileRoute("/ops/collaboration")({
  component: OpsCollaborationView,
});

function OpsCollaborationView() {
  return <CrossPersonaCollaborationWorkspace activePersona="ops" />;
}
