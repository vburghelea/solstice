import { createFileRoute } from "@tanstack/react-router";
import { LinkedAccounts } from "~/features/auth/components/linked-accounts";
import { SecuritySettings } from "~/features/auth/components/security-settings";
import { ProfileView } from "~/features/profile/components/profile-view";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal information, security settings, and linked
          accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileView />
        </div>
        <div className="space-y-8">
          <SecuritySettings />
          <LinkedAccounts />
        </div>
      </div>
    </div>
  );
}
