import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { isFeatureEnabled } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const showSinAdmin = isFeatureEnabled("sin_admin");

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {showSinAdmin
            ? "Manage global roles and SIN administration."
            : "Manage global roles."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Roles</CardTitle>
            <CardDescription>Manage global administrator roles.</CardDescription>
            <Button asChild className="w-fit">
              <Link to="/dashboard/admin/roles">Manage roles</Link>
            </Button>
          </CardHeader>
        </Card>
        {showSinAdmin ? (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>SIN Admin</CardTitle>
              <CardDescription>
                Configure organizations, reporting, security, and privacy workflows.
              </CardDescription>
              <Button asChild className="w-fit" variant="outline">
                <Link to="/dashboard/admin/sin">Open SIN admin</Link>
              </Button>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
