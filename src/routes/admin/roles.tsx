import { createFileRoute, redirect } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/admin/roles" });
  },
  head: () => createPageHead("Roles"),
});
