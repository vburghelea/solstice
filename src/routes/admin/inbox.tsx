import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/admin/inbox")({
  component: AdminInbox,
});

function AdminInbox() {
  const { user } = Route.useRouteContext() as {
    user: { id?: string | null; name?: string | null } | null;
  };
  return (
    <SharedInboxView
      persona="admin"
      userName={user?.name ?? null}
      userId={user?.id ?? null}
    />
  );
}
