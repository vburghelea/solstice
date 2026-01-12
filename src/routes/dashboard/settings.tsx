import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "~/features/settings/components/settings-view";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => createPageHead("Settings"),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <SettingsView />
    </div>
  );
}
