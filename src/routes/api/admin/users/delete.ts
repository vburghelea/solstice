import { createFileRoute } from "@tanstack/react-router";

// This route delegates to the deleteUser server function
export const Route = createFileRoute("/api/admin/users/delete")({
  component: () => null,
});
