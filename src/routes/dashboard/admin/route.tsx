import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSectionLayout } from "~/features/layouts/admin-layout";
import { requireGlobalAdmin } from "~/lib/auth/middleware/role-guard";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;

    if (!user) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }

    await requireGlobalAdmin(user, "/dashboard/forbidden", "/dashboard/settings");
  },
  head: () => createPageHead("Admin"),
  component: AdminSectionLayout,
});
