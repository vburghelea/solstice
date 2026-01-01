import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import {
  deleteSubmissionFile,
  prepareSubmissionFileReplacement,
  replaceSubmissionFile,
} from "~/features/forms/forms.mutations";
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
  const queryClient = useQueryClient();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);

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

  const replaceMutation = useMutation({
    mutationFn: async (payload: { submissionFileId: string; file: File }) => {
      const checksum = await hashFile(payload.file);
      const upload = await prepareSubmissionFileReplacement({
        data: {
          submissionFileId: payload.submissionFileId,
          fileName: payload.file.name,
          mimeType: payload.file.type || "application/octet-stream",
          sizeBytes: payload.file.size,
        },
      });

      if (!upload?.uploadUrl || !upload.storageKey) {
        throw new Error("Upload URL not available.");
      }

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: payload.file,
        headers: {
          "Content-Type": payload.file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }

      return replaceSubmissionFile({
        data: {
          submissionFileId: payload.submissionFileId,
          storageKey: upload.storageKey,
          fileName: payload.file.name,
          mimeType: payload.file.type || "application/octet-stream",
          sizeBytes: payload.file.size,
          checksum,
        },
      });
    },
    onMutate: (payload) => {
      setActiveFileId(payload.submissionFileId);
      setFileActionError(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forms", "submission-files"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "submission-versions"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "submissions"] });
    },
    onError: (error) => {
      setFileActionError(
        error instanceof Error ? error.message : "Failed to replace file.",
      );
    },
    onSettled: () => {
      setActiveFileId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (submissionFileId: string) =>
      deleteSubmissionFile({ data: { submissionFileId } }),
    onMutate: (submissionFileId) => {
      setActiveFileId(submissionFileId);
      setFileActionError(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forms", "submission-files"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "submission-versions"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "submissions"] });
    },
    onError: (error) => {
      setFileActionError(
        error instanceof Error ? error.message : "Failed to delete file.",
      );
    },
    onSettled: () => {
      setActiveFileId(null);
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
          {fileActionError ? (
            <p className="text-destructive text-sm font-medium">{fileActionError}</p>
          ) : null}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadMutation.mutate(file.id)}
                    disabled={downloadMutation.isPending}
                  >
                    Download
                  </Button>
                  <Input
                    id={`replace-submission-file-${file.id}`}
                    type="file"
                    className="sr-only"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0];
                      if (!nextFile) return;
                      replaceMutation.mutate({
                        submissionFileId: file.id,
                        file: nextFile,
                      });
                      event.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById(
                        `replace-submission-file-${file.id}`,
                      ) as HTMLInputElement | null;
                      input?.click();
                    }}
                    disabled={replaceMutation.isPending && activeFileId === file.id}
                  >
                    {replaceMutation.isPending && activeFileId === file.id
                      ? "Replacing..."
                      : "Replace"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending && activeFileId === file.id}
                      >
                        {deleteMutation.isPending && activeFileId === file.id
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action removes the attachment from the submission and
                          deletes the stored file.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(file.id)}>
                          Delete file
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function hashFile(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
