import { createFileRoute } from "@tanstack/react-router";
import { PrivacyAcceptanceCard } from "~/features/privacy/components/privacy-acceptance-card";
import { PrivacyDashboard } from "~/features/privacy/components/privacy-dashboard";

export const Route = createFileRoute("/dashboard/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <PrivacyAcceptanceCard />
      <PrivacyDashboard />
    </div>
  );
}
