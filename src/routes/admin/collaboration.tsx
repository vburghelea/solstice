import { createFileRoute } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";

export const Route = createFileRoute("/admin/collaboration")({
  component: AdminCollaborationView,
});

function AdminCollaborationView() {
  return <CrossPersonaCollaborationWorkspace activePersona="admin" />;
}
