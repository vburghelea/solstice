import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_portal");
  },
  component: SinPortalHome,
});

function SinPortalHome() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SIN Portal</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage reporting, forms, imports, and analytics for your organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Submit required reporting tasks.</CardDescription>
            <Button asChild className="w-fit">
              <Link to="/dashboard/sin/reporting">Open Reporting</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Forms</CardTitle>
            <CardDescription>Complete organization forms and surveys.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/sin/forms">View Forms</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Imports</CardTitle>
            <CardDescription>Track data imports and status updates.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/sin/imports">View Imports</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Build reports and export insights.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/sin/analytics">Open Analytics</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
