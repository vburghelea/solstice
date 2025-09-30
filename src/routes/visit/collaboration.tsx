import { createFileRoute } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";

export const Route = createFileRoute("/visit/collaboration")({
  component: VisitorCollaborationPreview,
});

function VisitorCollaborationPreview() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null } | null;
  };

  return (
    <CrossPersonaCollaborationWorkspace
      activePersona="player"
      userName={user?.name ?? null}
      mode="preview"
      previewMessage="Explore how teams coordinate across personas. Create an account or switch personas to contribute."
      inboxPathOverride="/visit/inbox"
    />
  );
}
