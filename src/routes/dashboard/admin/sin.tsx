import { createFileRoute } from "@tanstack/react-router";
import { AuditLogTable } from "~/features/audit/components/audit-log-table";
import { FormBuilderShell } from "~/features/forms/components/form-builder-shell";
import { ImportWizardShell } from "~/features/imports/components/import-wizard-shell";
import { NotificationPreferencesCard } from "~/features/notifications/components/notification-preferences-card";
import { NotificationTemplatePanel } from "~/features/notifications/components/notification-template-panel";
import { OrganizationAdminPanel } from "~/features/organizations/components/organization-admin-panel";
import { PrivacyAdminPanel } from "~/features/privacy/components/privacy-admin-panel";
import { PrivacyDashboard } from "~/features/privacy/components/privacy-dashboard";
import { RetentionPolicyPanel } from "~/features/privacy/components/retention-policy-panel";
import { ReportingDashboardShell } from "~/features/reporting/components/reporting-dashboard-shell";
import { ReportBuilderShell } from "~/features/reports/components/report-builder-shell";
import { SecurityDashboard } from "~/features/security/components/security-dashboard";

export const Route = createFileRoute("/dashboard/admin/sin")({
  component: SinAdminPage,
});

function SinAdminPage() {
  return (
    <div className="container mx-auto space-y-10 p-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Organizations & Tenancy</h2>
        <OrganizationAdminPanel />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Audit Logging</h2>
        <AuditLogTable />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <NotificationPreferencesCard />
          <NotificationTemplatePanel />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Security</h2>
        <SecurityDashboard />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Privacy & DSAR</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <PrivacyDashboard />
          <PrivacyAdminPanel />
        </div>
        <RetentionPolicyPanel />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dynamic Forms</h2>
        <FormBuilderShell />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bulk Imports</h2>
        <ImportWizardShell />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Reporting Cycles</h2>
        <ReportingDashboardShell />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Analytics & Export</h2>
        <ReportBuilderShell />
      </section>
    </div>
  );
}
