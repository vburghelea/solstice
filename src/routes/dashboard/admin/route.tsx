import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSectionLayout } from "~/features/layouts/admin-layout";
import { isAdminClient } from "~/lib/auth/utils/admin-check";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;

    if (!user) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }

    if (!isAdminClient(user)) {
      throw redirect({ to: "/dashboard/forbidden", search: { from: location.href } });
    }
  },
  component: AdminSectionLayout,
});
