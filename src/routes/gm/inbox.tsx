import { createFileRoute, notFound } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { isFeatureFlagEnabled } from "~/lib/feature-flags";

export const Route = createFileRoute("/gm/inbox")({
  beforeLoad: () => {
    if (!isFeatureFlagEnabled(WORKSPACE_FEATURE_FLAGS.sharedInbox)) {
      throw notFound();
    }
  },
  component: GmInbox,
});

function GmInbox() {
  const { user } = Route.useRouteContext() as {
    user: { id?: string | null; name?: string | null } | null;
  };
  return (
    <SharedInboxView
      persona="gm"
      userName={user?.name ?? null}
      userId={user?.id ?? null}
    />
  );
}
