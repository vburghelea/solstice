import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useOrgContext } from "~/features/organizations/org-context";
import { useAppForm } from "~/lib/hooks/useAppForm";
import {
  createSupportRequest,
  createSupportRequestAttachment,
  createSupportRequestAttachmentUpload,
} from "../support.mutations";
import { listMySupportRequests } from "../support.queries";
import {
  supportAttachmentAccept,
  supportAttachmentConfig,
  validateSupportAttachment,
} from "../support.utils";

const categoryOptions = [
  { value: "question", label: "Question" },
  { value: "issue", label: "Issue" },
  { value: "feature_request", label: "Feature request" },
  { value: "feedback", label: "Feedback" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function SupportRequestsPanel() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useOrgContext();
  const [useOrganization, setUseOrganization] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const form = useAppForm({
    defaultValues: {
      subject: "",
      message: "",
      category: "question",
      priority: "normal",
    },
    onSubmit: async ({ value }) => {
      if (useOrganization && !activeOrganizationId) {
        toast.error("Select an organization to submit this request.");
        return;
      }

      if (attachmentError && attachments.length > 0) {
        toast.error(attachmentError);
        return;
      }

      try {
        const created = await createSupportRequest({
          data: {
            subject: value.subject,
            message: value.message,
            category: value.category as
              | "question"
              | "issue"
              | "feature_request"
              | "feedback",
            priority: value.priority as "low" | "normal" | "high" | "urgent",
            organizationId: useOrganization
              ? (activeOrganizationId ?? undefined)
              : undefined,
          },
        });

        if (!created) {
          throw new Error("Failed to create support request.");
        }

        let attachmentFailure: string | null = null;
        for (const file of attachments) {
          try {
            const upload = await createSupportRequestAttachmentUpload({
              data: {
                requestId: created.id,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                sizeBytes: file.size,
              },
            });

            if (!upload?.uploadUrl || !upload.storageKey) {
              throw new Error(`Failed to request upload URL for ${file.name}.`);
            }

            const response = await fetch(upload.uploadUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type || "application/octet-stream" },
            });

            if (!response.ok) {
              throw new Error(`Attachment upload failed for ${file.name}.`);
            }

            await createSupportRequestAttachment({
              data: {
                requestId: created.id,
                storageKey: upload.storageKey,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                sizeBytes: file.size,
              },
            });
          } catch (error) {
            attachmentFailure =
              error instanceof Error
                ? error.message
                : `Attachment upload failed for ${file.name}.`;
            break;
          }
        }

        if (attachmentFailure) {
          toast.error(`Support request submitted, but ${attachmentFailure}`);
        } else {
          toast.success("Support request submitted.");
        }
        form.reset();
        setAttachments([]);
        setAttachmentError(null);
        if (attachmentInputRef.current) {
          attachmentInputRef.current.value = "";
        }
        void queryClient.invalidateQueries({ queryKey: ["support", "my-requests"] });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit support request.",
        );
      }
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["support", "my-requests", activeOrganizationId, useOrganization],
    queryFn: () =>
      listMySupportRequests({
        data: {
          organizationId: useOrganization
            ? (activeOrganizationId ?? undefined)
            : undefined,
        },
      }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a support request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={useOrganization}
              onCheckedChange={(checked) => setUseOrganization(Boolean(checked))}
              id="support-use-org"
            />
            <Label htmlFor="support-use-org">Associate with my active organization</Label>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="subject">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Brief summary"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="category">
              {(field) => (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Field name="priority">
              {(field) => (
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Field name="message">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="support-message">Message</Label>
                  <Textarea
                    id="support-message"
                    rows={4}
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Describe the issue or request"
                  />
                </div>
              )}
            </form.Field>
            <div className="space-y-2">
              <Label htmlFor="support-attachments">Attachments (optional)</Label>
              <Input
                ref={attachmentInputRef}
                id="support-attachments"
                type="file"
                multiple
                accept={supportAttachmentAccept}
                disabled={form.state.isSubmitting}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length === 0) {
                    setAttachments([]);
                    setAttachmentError(null);
                    return;
                  }

                  if (files.length > supportAttachmentConfig.maxFiles) {
                    setAttachmentError(
                      `Select up to ${supportAttachmentConfig.maxFiles} files.`,
                    );
                    setAttachments([]);
                    event.target.value = "";
                    return;
                  }

                  const invalid = files.find((file) => {
                    const validation = validateSupportAttachment({
                      fileName: file.name,
                      mimeType: file.type || "application/octet-stream",
                      sizeBytes: file.size,
                    });
                    return !validation.valid;
                  });

                  if (invalid) {
                    const validation = validateSupportAttachment({
                      fileName: invalid.name,
                      mimeType: invalid.type || "application/octet-stream",
                      sizeBytes: invalid.size,
                    });
                    setAttachmentError(
                      validation.error ?? `Attachment "${invalid.name}" is invalid.`,
                    );
                    setAttachments([]);
                    event.target.value = "";
                    return;
                  }

                  setAttachmentError(null);
                  setAttachments(files);
                }}
              />
              <p className="text-muted-foreground text-xs">
                Up to {supportAttachmentConfig.maxFiles} files,{" "}
                {Math.round(supportAttachmentConfig.maxSizeBytes / (1024 * 1024))}MB each.
              </p>
              {attachmentError ? (
                <p className="text-destructive text-sm font-medium">{attachmentError}</p>
              ) : null}
              {attachments.length > 0 ? (
                <div className="space-y-1 rounded-md border bg-muted/30 p-2 text-sm">
                  {attachments.map((file) => (
                    <div key={file.name} className="flex items-center justify-between">
                      <span className="truncate">
                        {file.name} • {formatFileSize(file.size)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((item) => item !== file),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              We will notify you in-app and by email when a response is posted.
            </p>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting}
              loadingText="Sending..."
            >
              Send request
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No support requests yet.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="space-y-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{request.subject}</p>
                    <p className="text-muted-foreground text-xs">
                      {request.category} • {formatDate(request.createdAt)}
                      {request.slaTargetAt
                        ? ` • SLA ${formatDateTime(request.slaTargetAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {request.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {request.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{request.message}</p>
                {request.responseMessage ? (
                  <div className="bg-muted/40 rounded-md p-3 text-sm">
                    <p className="font-medium">Response</p>
                    <p className="text-muted-foreground">{request.responseMessage}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
