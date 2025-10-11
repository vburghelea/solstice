import { createFileRoute } from "@tanstack/react-router";

import { ProfileView } from "~/features/profile/components/profile-view";

export const Route = createFileRoute("/player/profile/" as never)({
  component: PlayerProfilePage,
});

function PlayerProfilePage() {
  return (
    <div className="space-y-6">
      <ProfileView />
    </div>
  );
}
