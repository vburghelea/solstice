import { createFileRoute } from "@tanstack/react-router";
import { BlocklistView } from "~/features/social/components/blocklist-view";

export const Route = createFileRoute("/player/profile/blocklist/" as never)({
  component: PlayerProfileBlocklistPage,
});

function PlayerProfileBlocklistPage() {
  return (
    <div className="space-y-6">
      <BlocklistView />
    </div>
  );
}
