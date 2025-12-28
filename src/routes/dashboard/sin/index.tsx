import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { getAppNavSections } from "~/features/layouts/app-nav";
import { useOrgContext } from "~/features/organizations/org-context";
import { TutorialPanel } from "~/features/tutorials/components/tutorial-panel";
import { filterNavItems, requireFeatureInRoute } from "~/tenant/feature-gates";

const portalCardConfig = {
  "/dashboard/sin/reporting": {
    description: "Submit required reporting tasks.",
    cta: "Open Reporting",
    variant: "default" as const,
  },
  "/dashboard/sin/forms": {
    description: "Complete organization forms and surveys.",
    cta: "View Forms",
    variant: "outline" as const,
  },
  "/dashboard/sin/imports": {
    description: "Track data imports and status updates.",
    cta: "View Imports",
    variant: "outline" as const,
  },
  "/dashboard/sin/analytics": {
    description: "Build reports and export insights.",
    cta: "Open Analytics",
    variant: "outline" as const,
  },
  "/dashboard/sin/templates": {
    description: "Download the latest reporting and import templates.",
    cta: "View Templates",
    variant: "outline" as const,
  },
  "/dashboard/sin/help": {
    description: "Browse guides and FAQs for common tasks.",
    cta: "Open Help",
    variant: "outline" as const,
  },
  "/dashboard/sin/support": {
    description: "Send support requests and feedback.",
    cta: "Open Support",
    variant: "outline" as const,
  },
};

export const Route = createFileRoute("/dashboard/sin/")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_portal");
  },
  component: SinPortalHome,
});

function SinPortalHome() {
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;
  const { organizationRole } = useOrgContext();

  const cards = useMemo(() => {
    const navItems = getAppNavSections()
      .flatMap((section) => section.items)
      .filter((item) => Object.prototype.hasOwnProperty.call(portalCardConfig, item.to));

    return filterNavItems(navItems, { user, organizationRole }).map((item) => {
      const config = portalCardConfig[item.to as keyof typeof portalCardConfig]!;
      return {
        to: item.to,
        title: item.label,
        description: config.description,
        cta: config.cta,
        variant: config.variant,
      };
    });
  }, [organizationRole, user]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SIN Portal</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage reporting, forms, imports, and analytics for your organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <TutorialPanel />
    </div>
  );
}
