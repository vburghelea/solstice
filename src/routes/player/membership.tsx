import { createFileRoute } from "@tanstack/react-router";

import { MembershipPage } from "~/features/membership/components/player-membership-page";

export const Route = createFileRoute("/player/membership")({
  component: MembershipPage,
});
