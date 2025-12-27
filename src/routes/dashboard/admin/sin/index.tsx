import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/dashboard/admin/sin/")({
  component: SinAdminOverview,
});

function SinAdminOverview() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Create and manage tenant hierarchy.</CardDescription>
            <Button asChild className="w-fit">
              <Link to="/dashboard/admin/sin/organizations">Manage orgs</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Audit</CardTitle>
            <CardDescription>Review audit trails and verification.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/audit">View audit logs</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage templates and delivery settings.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/notifications">Manage notifications</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Security</CardTitle>
            <CardDescription>Monitor auth and security controls.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/security">Open security</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Manage privacy policies and retention.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/privacy">Open privacy</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Forms</CardTitle>
            <CardDescription>Build, publish, and review forms.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/forms">Open forms</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Imports</CardTitle>
            <CardDescription>Run import workflows and batch jobs.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/imports">Open imports</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Configure reporting cycles and tasks.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/reporting">Open reporting</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Build reports and exports.</CardDescription>
            <Button asChild className="w-fit" variant="outline">
              <Link to="/dashboard/admin/sin/analytics">Open analytics</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
