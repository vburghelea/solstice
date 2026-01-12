import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { getSinAdminNav } from "~/features/layouts/sin-admin-nav";
import { createPageHead } from "~/shared/lib/page-head";
import { filterNavItems } from "~/tenant/feature-gates";

const adminCardConfig = {
  "/dashboard/admin/sin/organizations": {
    description: "Create and manage tenant hierarchy.",
    cta: "Manage orgs",
    variant: "default" as const,
  },
  "/dashboard/admin/sin/audit": {
    description: "Review audit trails and verification.",
    cta: "View audit logs",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/notifications": {
    description: "Manage templates and delivery settings.",
    cta: "Manage notifications",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/security": {
    description: "Monitor auth and security controls.",
    cta: "Open security",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/privacy": {
    description: "Manage privacy policies and retention.",
    cta: "Open privacy",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/forms": {
    description: "Build, publish, and review forms.",
    cta: "Open forms",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/imports": {
    description: "Run import workflows and batch jobs.",
    cta: "Open imports",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/reporting": {
    description: "Configure reporting cycles and tasks.",
    cta: "Open reporting",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/analytics": {
    description: "Build reports and exports.",
    cta: "Open analytics",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/templates": {
    description: "Manage global and organization templates.",
    cta: "Open templates",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/support": {
    description: "Respond to support requests and feedback.",
    cta: "Open support",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/data-catalog": {
    description: "Maintain the data catalog index.",
    cta: "Open catalog",
    variant: "outline" as const,
  },
  "/dashboard/admin/sin/data-quality": {
    description: "Monitor data quality checks and issues.",
    cta: "Open data quality",
    variant: "outline" as const,
  },
};

export const Route = createFileRoute("/dashboard/admin/sin/")({
  head: () => createPageHead("SIN Admin Overview"),
  component: SinAdminOverview,
});

function SinAdminOverview() {
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;

  const cards = useMemo(() => {
    const navItems = getSinAdminNav().filter((item) =>
      Object.prototype.hasOwnProperty.call(adminCardConfig, item.to),
    );

    return filterNavItems(navItems, { user }).map((item) => {
      const config = adminCardConfig[item.to as keyof typeof adminCardConfig]!;
      return {
        to: item.to,
        title: item.label,
        description: config.description,
        cta: config.cta,
        variant: config.variant,
      };
    });
  }, [user]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.to}>
            <CardHeader className="space-y-2">
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
              <Button asChild className="w-fit" variant={card.variant}>
                <Link to={card.to}>{card.cta}</Link>
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
