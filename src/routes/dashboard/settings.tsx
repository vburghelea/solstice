import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "~/features/settings/components/settings-view";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <SettingsView />
    </div>
  );
}
