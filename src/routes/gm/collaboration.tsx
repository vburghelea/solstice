import { createFileRoute, notFound } from "@tanstack/react-router";

import { CrossPersonaCollaborationWorkspace } from "~/features/collaboration/components/cross-persona-collaboration-workspace";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { isFeatureFlagEnabled } from "~/lib/feature-flags";

export const Route = createFileRoute("/gm/collaboration")({
  beforeLoad: () => {
    if (!isFeatureFlagEnabled(WORKSPACE_FEATURE_FLAGS.collaboration)) {
      throw notFound();
    }
  },
  component: GameMasterCollaborationView,
});

function GameMasterCollaborationView() {
  return <CrossPersonaCollaborationWorkspace activePersona="gm" />;
}
