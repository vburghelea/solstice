import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "~/features/layouts/admin-layout";
import { requireCompleteProfile } from "~/features/profile/profile-guard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context }) => {
    requireCompleteProfile(context.user);
  },
});

function DashboardLayout() {
  return <AdminLayout />;
}
