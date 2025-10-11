import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/ops/inbox")({
  component: OpsInbox,
});

function OpsInbox() {
  const { user } = Route.useRouteContext() as {
    user: { id?: string | null; name?: string | null } | null;
  };
  return (
    <SharedInboxView
      persona="ops"
      userName={user?.name ?? null}
      userId={user?.id ?? null}
    />
  );
}
