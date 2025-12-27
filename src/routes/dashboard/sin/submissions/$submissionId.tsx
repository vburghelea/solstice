import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  getFormSubmission,
  getSubmissionFileDownloadUrl,
  listFormSubmissionVersions,
  listSubmissionFiles,
} from "~/features/forms/forms.queries";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/submissions/$submissionId")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_forms");
  },
  loader: async ({ params }) => {
    const submission = await getFormSubmission({
      data: { submissionId: params.submissionId },
    });
    return { submission };
  },
  component: SubmissionDetailPage,
});

function SubmissionDetailPage() {
  const { submission } = Route.useLoaderData();
  const submissionId = submission?.id ?? null;

  const { data: versions = [] } = useQuery({
    queryKey: ["forms", "submission-versions", submissionId],
    queryFn: () =>
      submissionId ? listFormSubmissionVersions({ data: { submissionId } }) : [],
    enabled: Boolean(submissionId),
  });

  const { data: files = [] } = useQuery({
    queryKey: ["forms", "submission-files", submissionId],
    queryFn: () => (submissionId ? listSubmissionFiles({ data: { submissionId } }) : []),
    enabled: Boolean(submissionId),
  });

  const downloadMutation = useMutation({
    mutationFn: (submissionFileId: string) =>
      getSubmissionFileDownloadUrl({ data: { submissionFileId } }),
    onSuccess: (result) => {
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    },
  });

  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission not found.</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Submission details
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {submission.formName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {submission.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-muted-foreground">
              Submitted {new Date(submission.createdAt).toLocaleDateString()}
            </span>
          </div>
          {submission.reviewNotes ? (
            <p className="text-muted-foreground text-sm">
              Review notes: {submission.reviewNotes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No version history yet.</p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">Version {version.versionNumber}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {version.changeReason || "Submitted"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files uploaded.</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-muted-foreground text-xs">{file.mimeType}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadMutation.mutate(file.id)}
                  disabled={downloadMutation.isPending}
                >
                  Download
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
