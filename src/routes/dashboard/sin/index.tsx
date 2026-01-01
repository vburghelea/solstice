import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { listForms } from "~/features/forms/forms.queries";
import { listImportJobs } from "~/features/imports/imports.queries";
import { getAppNavSections } from "~/features/layouts/app-nav";
import { listOrganizationJoinRequests } from "~/features/organizations/join-requests/join-requests.queries";
import { useOrgContext } from "~/features/organizations/org-context";
import { listReportingOverview } from "~/features/reporting/reporting.queries";
import { TutorialPanel } from "~/features/tutorials/components/tutorial-panel";
import {
  filterNavItems,
  isFeatureEnabled,
  requireFeatureInRoute,
} from "~/tenant/feature-gates";

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

const tourTargets: Record<string, string> = {
  "/dashboard/sin/reporting": "sin-reporting-card",
  "/dashboard/sin/forms": "sin-forms-card",
  "/dashboard/sin/analytics": "sin-analytics-card",
  "/dashboard/sin/templates": "sin-templates-card",
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
  const { activeOrganizationId, organizationRole } = useOrgContext();
  const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
  const showJoinRequests = isFeatureEnabled("org_join_requests") && isOrgAdmin;

  const { data: reportingOverview = [], isLoading: isReportingLoading } = useQuery({
    queryKey: ["reporting", "portal", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listReportingOverview({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  const { data: forms = [], isLoading: isFormsLoading } = useQuery({
    queryKey: ["sin", "forms", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listForms({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  const { data: importJobs = [], isLoading: isImportsLoading } = useQuery({
    queryKey: ["imports", "portal", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listImportJobs({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  const { data: joinRequests = [], isLoading: isJoinRequestsLoading } = useQuery({
    queryKey: ["organizations", "join-requests", activeOrganizationId],
    queryFn: () =>
      listOrganizationJoinRequests({
        data: { organizationId: activeOrganizationId ?? "", status: "pending" },
      }),
    enabled: showJoinRequests && Boolean(activeOrganizationId),
  });

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

  const stats = useMemo(() => {
    // Use date-only string comparisons to avoid UTC midnight issues
    const formatDateOnly = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    const todayStr = formatDateOnly(today);
    const dueSoonDate = new Date();
    dueSoonDate.setDate(today.getDate() + 30);
    const dueSoonStr = formatDateOnly(dueSoonDate);

    // Include "under_review" as submitted for due/overdue calculations
    const isSubmitted = (status: string) =>
      status === "submitted" || status === "under_review" || status === "approved";
    const dueSoonCount = reportingOverview.filter((item) => {
      // dueDate is YYYY-MM-DD string from DB date column
      return (
        item.dueDate >= todayStr &&
        item.dueDate <= dueSoonStr &&
        !isSubmitted(item.status)
      );
    }).length;
    const overdueCount = reportingOverview.filter((item) => {
      return item.dueDate < todayStr && !isSubmitted(item.status);
    }).length;
    const changesRequestedCount = reportingOverview.filter(
      (item) => item.status === "changes_requested",
    ).length;
    const submittedCount = reportingOverview.filter((item) =>
      isSubmitted(item.status),
    ).length;

    const importInProgressCount = importJobs.filter(
      (job) => !["completed", "failed", "cancelled", "rolled_back"].includes(job.status),
    ).length;

    const summary = [
      {
        key: "due",
        label: "Reporting due (30d)",
        value: dueSoonCount,
        helper: dueSoonCount > 0 ? "Upcoming deadlines" : "No tasks due soon",
        to: "/dashboard/sin/reporting",
      },
      {
        key: "forms",
        label: "Assigned forms",
        value: forms.length,
        helper: forms.length > 0 ? "Active forms for your org" : "No forms assigned",
        to: "/dashboard/sin/forms",
      },
    ];

    if (isOrgAdmin) {
      summary.push({
        key: "overdue",
        label: "Overdue reporting",
        value: overdueCount,
        helper: overdueCount > 0 ? "Needs attention" : "No overdue tasks",
        to: "/dashboard/sin/reporting",
      });

      if (showJoinRequests) {
        summary.push({
          key: "join-requests",
          label: "Pending join requests",
          value: joinRequests.length,
          helper:
            joinRequests.length > 0 ? "Review access requests" : "No pending requests",
          to: "/dashboard/sin/organization-access",
        });
      } else {
        summary.push({
          key: "imports",
          label: "Imports in progress",
          value: importInProgressCount,
          helper:
            importInProgressCount > 0
              ? "Imports currently processing"
              : "No active imports",
          to: "/dashboard/sin/imports",
        });
      }
    } else if (organizationRole === "reporter") {
      summary.push(
        {
          key: "changes",
          label: "Changes requested",
          value: changesRequestedCount,
          helper:
            changesRequestedCount > 0
              ? "Resubmissions needed"
              : "No resubmissions needed",
          to: "/dashboard/sin/reporting",
        },
        {
          key: "submitted",
          label: "Submitted reports",
          value: submittedCount,
          helper: submittedCount > 0 ? "Completed this cycle" : "No reports submitted",
          to: "/dashboard/sin/reporting",
        },
      );
    } else {
      summary.push(
        {
          key: "submitted",
          label: "Submitted reports",
          value: submittedCount,
          helper: submittedCount > 0 ? "Completed this cycle" : "No reports submitted",
          to: "/dashboard/sin/reporting",
        },
        {
          key: "imports",
          label: "Imports in progress",
          value: importInProgressCount,
          helper:
            importInProgressCount > 0
              ? "Imports currently processing"
              : "No active imports",
          to: "/dashboard/sin/imports",
        },
      );
    }

    return summary;
  }, [
    forms.length,
    importJobs,
    isOrgAdmin,
    joinRequests.length,
    organizationRole,
    reportingOverview,
    showJoinRequests,
  ]);

  const isStatsLoading =
    isReportingLoading ||
    isFormsLoading ||
    isImportsLoading ||
    (showJoinRequests && isJoinRequestsLoading);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SIN Portal</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage reporting, forms, imports, and analytics for your organization.
        </p>
      </div>

      <section aria-label="Role summary">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.key}>
              <CardHeader className="space-y-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">
                  {isStatsLoading ? "—" : stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-xs">{stat.helper}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to={stat.to}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.to} data-tour={tourTargets[card.to]}>
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
