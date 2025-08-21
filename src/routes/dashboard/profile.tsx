import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LinkedAccounts } from "~/features/auth/components/linked-accounts";
import { SecuritySettings } from "~/features/auth/components/security-settings";
import { ProfileView } from "~/features/profile/components/profile-view";

export const Route = createFileRoute("/dashboard/profile")({
  component: () => <Outlet />,
});
