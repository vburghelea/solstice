import { createFileRoute } from "@tanstack/react-router";

import { SharedInboxView } from "~/features/inbox/components/shared-inbox-view";

export const Route = createFileRoute("/gm/inbox")({
  component: GmInbox,
});

function GmInbox() {
  return <SharedInboxView persona="gm" />;
}
