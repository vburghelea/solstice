import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionText,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useOrgContext } from "~/features/organizations/org-context";
import { getOrganization } from "~/features/organizations/organizations.queries";
import { updateReportingMetadata } from "~/features/reporting/reporting.mutations";
import {
  listReportingOverview,
  listReportingSubmissionHistory,
} from "~/features/reporting/reporting.queries";
import { reportingMetadataSchema } from "~/features/reporting/reporting.schemas";
import type { ReportingMetadata } from "~/features/reporting/reporting.schemas";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin/reporting")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_reporting");
  },
  head: () => createPageHead("Reporting"),
  component: SinReportingPage,
});

const statusTone = (status: string) => {
  if (status === "submitted" || status === "approved") {
    return "bg-green-100 text-green-800";
  }
  if (status === "overdue" || status === "changes_requested") {
    return "bg-amber-100 text-amber-800";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-200 text-gray-700";
};

type ReportingMetadataFormValues = {
  fiscalYearStart: string;
  fiscalYearEnd: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  agreementId: string;
  agreementName: string;
  agreementStart: string;
  agreementEnd: string;
  nccpStatus: string;
  nccpNumber: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  reportingFrequency: string;
};

const buildReportingMetadataDefaults = (
  metadata: ReportingMetadata | null,
): ReportingMetadataFormValues => ({
  fiscalYearStart: metadata?.fiscalYearStart ?? "",
  fiscalYearEnd: metadata?.fiscalYearEnd ?? "",
  reportingPeriodStart: metadata?.reportingPeriodStart ?? "",
  reportingPeriodEnd: metadata?.reportingPeriodEnd ?? "",
  agreementId: metadata?.agreementId ?? "",
  agreementName: metadata?.agreementName ?? "",
  agreementStart: metadata?.agreementStart ?? "",
  agreementEnd: metadata?.agreementEnd ?? "",
  nccpStatus: metadata?.nccpStatus ?? "",
  nccpNumber: metadata?.nccpNumber ?? "",
  primaryContactName: metadata?.primaryContactName ?? "",
  primaryContactEmail: metadata?.primaryContactEmail ?? "",
  primaryContactPhone: metadata?.primaryContactPhone ?? "",
  reportingFrequency: metadata?.reportingFrequency ?? "",
});

const normalizeMetadataInput = (value: ReportingMetadataFormValues) => {
  const normalizeField = (field: string) => {
    const trimmed = field.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    fiscalYearStart: normalizeField(value.fiscalYearStart),
    fiscalYearEnd: normalizeField(value.fiscalYearEnd),
    reportingPeriodStart: normalizeField(value.reportingPeriodStart),
    reportingPeriodEnd: normalizeField(value.reportingPeriodEnd),
    agreementId: normalizeField(value.agreementId),
    agreementName: normalizeField(value.agreementName),
    agreementStart: normalizeField(value.agreementStart),
    agreementEnd: normalizeField(value.agreementEnd),
    nccpStatus: normalizeField(value.nccpStatus),
    nccpNumber: normalizeField(value.nccpNumber),
    primaryContactName: normalizeField(value.primaryContactName),
    primaryContactEmail: normalizeField(value.primaryContactEmail),
    primaryContactPhone: normalizeField(value.primaryContactPhone),
    reportingFrequency: normalizeField(value.reportingFrequency),
  };
};

function SinReportingPage() {
  const queryClient = useQueryClient();
  const { activeOrganizationId, organizationRole } = useOrgContext();
  const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
  const [historySubmissionId, setHistorySubmissionId] = useState<string | null>(null);

  const { data: overview = [], isLoading } = useQuery({
    queryKey: ["reporting", "portal", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listReportingOverview({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  const { data: organization } = useQuery({
    queryKey: ["organizations", "detail", activeOrganizationId],
    queryFn: () =>
      getOrganization({ data: { organizationId: activeOrganizationId ?? "" } }),
    enabled: Boolean(activeOrganizationId),
  });

  const parsedMetadata = useMemo(() => {
    const raw = (organization?.metadata ?? {})["reporting"] ?? {};
    const parsed = reportingMetadataSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }, [organization?.metadata]);

  const metadataDefaults = useMemo(
    () => buildReportingMetadataDefaults(parsedMetadata),
    [parsedMetadata],
  );

  const metadataForm = useAppForm<ReportingMetadataFormValues>({
    defaultValues: metadataDefaults,
    onSubmit: async ({ value }) => {
      if (!activeOrganizationId) return;
      try {
        await updateReportingMetadata({
          data: {
            organizationId: activeOrganizationId,
            metadata: normalizeMetadataInput(value),
          },
        });
        toast.success("Reporting metadata updated.");
        await queryClient.invalidateQueries({
          queryKey: ["organizations", "detail", activeOrganizationId],
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update metadata.",
        );
      }
    },
  });

  useEffect(() => {
    metadataForm.reset(metadataDefaults);
  }, [metadataDefaults, metadataForm]);

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["reporting", "history", historySubmissionId],
    queryFn: () =>
      historySubmissionId
        ? listReportingSubmissionHistory({
            data: { submissionId: historySubmissionId },
          })
        : [],
    enabled: Boolean(historySubmissionId),
  });

  const selectedSubmission = useMemo(
    () => overview.find((item) => item.submissionId === historySubmissionId) ?? null,
    [historySubmissionId, overview],
  );

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [history],
  );

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to view reporting tasks.</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard/select-org">Choose organization</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Reporting Tasks
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track upcoming reporting submissions and review your history.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/sin/templates?context=reporting">View templates</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reporting metadata</CardTitle>
          <CardDescription>
            Keep agreement, fiscal period, and contact details current for reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void metadataForm.handleSubmit();
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <metadataForm.Field name="agreementName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Agreement name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="agreementId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Agreement ID</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="agreementStart">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Agreement start</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="agreementEnd">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Agreement end</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <metadataForm.Field name="fiscalYearStart">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Fiscal year start</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="fiscalYearEnd">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Fiscal year end</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="reportingPeriodStart">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Reporting period start</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="reportingPeriodEnd">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Reporting period end</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="reportingFrequency">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Reporting frequency</Label>
                    <Input
                      id={field.name}
                      placeholder="Annual, quarterly, etc."
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <metadataForm.Field name="nccpStatus">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>NCCP status</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="nccpNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>NCCP number</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="primaryContactName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Primary contact name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="primaryContactEmail">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Primary contact email</Label>
                    <Input
                      id={field.name}
                      type="email"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
              <metadataForm.Field name="primaryContactPhone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Primary contact phone</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!isOrgAdmin}
                    />
                  </div>
                )}
              </metadataForm.Field>
            </div>

            {isOrgAdmin ? (
              <FormSubmitButton isSubmitting={metadataForm.state.isSubmitting}>
                Save metadata
              </FormSubmitButton>
            ) : (
              <p className="text-muted-foreground text-sm">
                Owner or admin access is required to edit reporting metadata.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-muted-foreground">Loading reporting tasks…</div>
      ) : overview.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reporting tasks yet.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {overview.map((item) => (
            <Card key={item.submissionId}>
              <CardHeader
                className={[
                  "flex flex-col gap-2",
                  "sm:flex-row sm:items-center sm:justify-between",
                ].join(" ")}
              >
                <div>
                  <CardTitle className="text-base">{item.taskTitle}</CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Due {new Date(item.dueDate).toLocaleDateString()} • Cycle{" "}
                    {item.cycleName}
                  </p>
                </div>
                <Badge variant="secondary" className={statusTone(item.status)}>
                  {item.status.replace(/_/g, " ")}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link to={`/dashboard/sin/forms/${item.formId}`}>Open form</Link>
                </Button>
                {item.formSubmissionId ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/dashboard/sin/submissions/${item.formSubmissionId}`}>
                      View submission
                    </Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHistorySubmissionId(item.submissionId)}
                >
                  View history
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(historySubmissionId)}
        onOpenChange={(open) => {
          if (!open) setHistorySubmissionId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission history</DialogTitle>
            <DialogDescriptionText>
              {selectedSubmission
                ? `${selectedSubmission.taskTitle} • ${selectedSubmission.cycleName}`
                : "Review reporting submission events."}
            </DialogDescriptionText>
          </DialogHeader>
          {isHistoryLoading ? (
            <p className="text-muted-foreground text-sm">Loading history...</p>
          ) : sortedHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submission history yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={[
                    "flex items-start justify-between gap-3",
                    "rounded-md border px-3 py-2 text-sm",
                  ].join(" ")}
                >
                  <div className="space-y-1">
                    <Badge variant="secondary" className={statusTone(entry.action)}>
                      {entry.action.replace(/_/g, " ")}
                    </Badge>
                    {entry.notes ? (
                      <p className="text-muted-foreground">{entry.notes}</p>
                    ) : null}
                    {entry.actorId ? (
                      <p className="text-muted-foreground text-xs">
                        Actor: {entry.actorId}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
