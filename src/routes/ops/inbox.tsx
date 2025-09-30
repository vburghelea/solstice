import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/ops/inbox")({
  component: OpsInbox,
});

function OpsInbox() {
  return <SharedInboxView persona="ops" />;
}
