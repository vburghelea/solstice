import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DynamicFormRenderer } from "~/features/forms/components/form-builder-shell";
import {
  getForm,
  getLatestFormVersion,
  listFormSubmissions,
} from "~/features/forms/forms.queries";
import {
  getTemplateDownloadUrl,
  getTemplatePreviewUrl,
} from "~/features/templates/templates.mutations";
import { listTemplates } from "~/features/templates/templates.queries";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin/forms/$formId")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_forms");
  },
  loader: async ({ params }) => {
    const [form, latestVersion] = await Promise.all([
      getForm({ data: { formId: params.formId } }),
      getLatestFormVersion({ data: { formId: params.formId } }),
    ]);

    return { form, latestVersion };
  },
  head: () => createPageHead("Form details"),
  component: SinFormDetailPage,
});

const formatBytes = (size: number) => {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
};

function SinFormDetailPage() {
  const { form, latestVersion } = Route.useLoaderData();
  const formId = form?.id ?? null;

  const { data: submissions = [] } = useQuery({
    queryKey: ["forms", "submissions", formId],
    queryFn: () => (formId ? listFormSubmissions({ data: { formId } }) : []),
    enabled: Boolean(formId),
  });

  const organizationId = form?.organizationId ?? undefined;
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates", "forms", formId, organizationId],
    queryFn: () =>
      formId
        ? listTemplates({
            data: {
              organizationId,
              context: "forms",
            },
          })
        : [],
    enabled: Boolean(formId),
  });

  const downloadMutation = useMutation({
    mutationFn: (templateId: string) => getTemplateDownloadUrl({ data: { templateId } }),
    onSuccess: (result) => {
      if (!result?.downloadUrl) {
        toast.error("Template download failed.");
        return;
      }
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Template download failed.");
    },
  });

  const previewMutation = useMutation({
    mutationFn: (templateId: string) => getTemplatePreviewUrl({ data: { templateId } }),
    onSuccess: (result) => {
      if (!result?.previewUrl) {
        toast.error("Template preview failed.");
        return;
      }
      window.open(result.previewUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Template preview failed.");
    },
  });

  const visibleTemplates = templates.slice(0, 3);

  if (!form || !latestVersion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Form not found.</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{form.name}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {form.description || "Complete the form for your organization."}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Templates</CardTitle>
            <p className="text-muted-foreground text-sm">
              Download the latest form templates and sample files.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/sin/templates?context=forms">View templates</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {templatesLoading ? (
            <p className="text-muted-foreground text-sm">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No templates available.</p>
          ) : (
            <div className="space-y-2">
              {visibleTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {template.fileName} • {formatBytes(template.sizeBytes ?? 0)} •
                      Updated {formatDate(template.updatedAt ?? template.createdAt)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {template.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => previewMutation.mutate(template.id)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadMutation.mutate(template.id)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
              {templates.length > visibleTemplates.length ? (
                <Button asChild variant="ghost" size="sm" className="w-fit">
                  <Link to="/dashboard/sin/templates?context=forms">
                    View all templates
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit response</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicFormRenderer
            formId={form.id}
            organizationId={form.organizationId}
            definition={latestVersion.definition as FormDefinition}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet.</p>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">Submission {submission.id.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">
                    {submission.status.replace(/_/g, " ")}
                  </Badge>
                  <Link
                    to={`/dashboard/sin/submissions/${submission.id}`}
                    className="text-primary text-sm hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
