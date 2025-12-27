import { createFileRoute } from "@tanstack/react-router";
import { NotificationPreferencesCard } from "~/features/notifications/components/notification-preferences-card";
import { NotificationTemplatePanel } from "~/features/notifications/components/notification-template-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/notifications")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_notifications");
  },
  component: SinNotificationsPage,
});

function SinNotificationsPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <NotificationTemplatePanel />
        <NotificationPreferencesCard />
      </div>
    </div>
  );
}
