import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "~/features/layouts/admin-layout";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context, location }) => {
    // ✅  Redirect unauthenticated visitors to `/auth/login`
    // ✅  Redirect authenticated but incomplete profiles to `/onboarding`
    requireAuthAndProfile({ user: context.user, location });
  },
});

function DashboardLayout() {
  return <AdminLayout />;
}
