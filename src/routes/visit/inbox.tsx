import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/visit/inbox")({
  component: VisitorInboxPreview,
});

function VisitorInboxPreview() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null } | null;
  };

  return (
    <SharedInboxView
      persona="player"
      userName={user?.name ?? null}
      mode="preview"
      previewMessage="You’re viewing a live slice of Leo’s shared inbox. Sign up or switch personas to collaborate directly."
    />
  );
}
