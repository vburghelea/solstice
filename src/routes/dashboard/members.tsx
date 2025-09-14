import { createFileRoute } from "@tanstack/react-router";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/dashboard/members")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Members</h1>
      {/* Placeholder list until data/API is implemented */}
      <List>
        <List.Item className="text-muted-foreground">Feature coming soon.</List.Item>
      </List>
    </div>
  );
}
