import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/dashboard/forbidden")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="border-border bg-card mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-lg border p-12 text-center shadow-sm">
      <div className="bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Access restricted</h1>
        <p className="text-muted-foreground">
          You don’t have permission to view this section. If you believe this is a
          mistake, reach out to an administrator or head back to your dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="secondary">
          <Link to="/dashboard">Return to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <a href="mailto:info@quadball.ca">Contact support</a>
        </Button>
      </div>
    </div>
  );
}
