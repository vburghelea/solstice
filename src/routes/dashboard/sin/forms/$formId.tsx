import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DynamicFormRenderer } from "~/features/forms/components/form-builder-shell";
import {
  getForm,
  getLatestFormVersion,
  listFormSubmissions,
} from "~/features/forms/forms.queries";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

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
  component: SinFormDetailPage,
});

function SinFormDetailPage() {
  const { form, latestVersion } = Route.useLoaderData();
  const formId = form?.id ?? null;

  const { data: submissions = [] } = useQuery({
    queryKey: ["forms", "submissions", formId],
    queryFn: () => (formId ? listFormSubmissions({ data: { formId } }) : []),
    enabled: Boolean(formId),
  });

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
