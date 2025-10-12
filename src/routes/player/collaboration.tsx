import { createFileRoute, notFound } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { isFeatureFlagEnabled } from "~/lib/feature-flags";

export const Route = createFileRoute("/player/collaboration")({
  beforeLoad: () => {
    if (!isFeatureFlagEnabled(WORKSPACE_FEATURE_FLAGS.collaboration)) {
      throw notFound();
    }
  },
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
