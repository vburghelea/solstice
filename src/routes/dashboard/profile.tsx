import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "~/features/profile/components/profile-view";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal information
        </p>
      </div>

      <ProfileView />
    </div>
  );
}
