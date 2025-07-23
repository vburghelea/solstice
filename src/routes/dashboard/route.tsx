import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "~/features/layouts/admin-layout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
});

function DashboardLayout() {
  return <AdminLayout />;
}
