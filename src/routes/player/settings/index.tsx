import { createFileRoute } from "@tanstack/react-router";

import { SettingsView } from "~/features/settings/components/settings-view";

export const Route = createFileRoute("/player/settings/" as never)({
  component: PlayerSettingsPage,
});

function PlayerSettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsView />
    </div>
  );
}
