import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSectionLayout } from "~/features/layouts/admin-layout";
import { requireGlobalAdmin } from "~/lib/auth/middleware/role-guard";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;

    if (!user) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }

    await requireGlobalAdmin(user, "/dashboard/forbidden", "/dashboard/settings");
  },
  component: AdminSectionLayout,
});
