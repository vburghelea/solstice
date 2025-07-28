import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal information
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">Name</label>
            <p className="text-base">{user?.name || "Not set"}</p>
          </div>
          <div>
            <label className="text-muted-foreground text-sm font-medium">Email</label>
            <p className="text-base">{user?.email || "Not set"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
