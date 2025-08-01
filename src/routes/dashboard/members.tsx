import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/members")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Members</h1>
      <p className="text-muted-foreground">Feature coming soon.</p>
    </div>
  );
}
