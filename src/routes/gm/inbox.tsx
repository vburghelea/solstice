import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/gm/inbox")({
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
