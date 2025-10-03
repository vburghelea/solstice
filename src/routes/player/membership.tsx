import { createFileRoute } from "@tanstack/react-router";

import { MembershipPage } from "~/routes/dashboard/membership";

export const Route = createFileRoute("/player/membership")({
  component: MembershipPage,
});
