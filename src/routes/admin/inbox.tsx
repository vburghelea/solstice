import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/admin/inbox")({
  component: AdminInbox,
});

function AdminInbox() {
  return <SharedInboxView persona="admin" />;
}
