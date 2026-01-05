import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { respondSupportRequest } from "../support.mutations";
import {
  getSupportRequestAttachmentDownloadUrl,
  listSupportRequestsAdmin,
} from "../support.queries";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

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

const toDateTimeLocal = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function SupportAdminPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [nextStatus, setNextStatus] = useState("resolved");
  const [nextPriority, setNextPriority] = useState("normal");
  const [slaTargetAt, setSlaTargetAt] = useState("");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(
    null,
  );

  const downloadMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      getSupportRequestAttachmentDownloadUrl({ data: { attachmentId } }),
    onMutate: (attachmentId) => {
      setDownloadingAttachmentId(attachmentId);
    },
    onSuccess: (result) => {
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        return;
      }
      toast.error("Attachment is not available for download.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to download attachment.",
      );
    },
    onSettled: () => {
      setDownloadingAttachmentId(null);
    },
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["support", "admin", status, search],
    queryFn: () =>
      listSupportRequestsAdmin({
        data: {
          status:
            status === "all"
              ? undefined
              : (status as "open" | "in_progress" | "resolved" | "closed"),
          search: search.trim() ? search.trim() : undefined,
        },
      }),
  });

  const respondMutation = useMutation({
    mutationFn: () =>
      activeResponseId
        ? respondSupportRequest({
            data: {
              requestId: activeResponseId,
              status: nextStatus as "resolved" | "closed" | "in_progress" | "open",
              responseMessage: responseMessage.trim() || undefined,
              priority: nextPriority as "low" | "normal" | "high" | "urgent",
              slaTargetAt: slaTargetAt ? new Date(slaTargetAt).toISOString() : undefined,
            },
          })
        : Promise.resolve(null),
    onSuccess: () => {
      toast.success("Response saved.");
      setResponseMessage("");
      setActiveResponseId(null);
      setSlaTargetAt("");
      void queryClient.invalidateQueries({ queryKey: ["support", "admin"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to respond.");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Support requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Search requests"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-64"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading requests…</p>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No support requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="space-y-3 rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{request.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {request.category} • {request.organizationId ?? "General"}
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
                  {request.attachments?.length ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Attachments</p>
                      <div className="space-y-2">
                        {request.attachments.map((attachment) => {
                          const isDownloading =
                            downloadMutation.isPending &&
                            downloadingAttachmentId === attachment.id;
                          return (
                            <div
                              key={attachment.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs"
                            >
                              <div>
                                <p className="font-semibold">{attachment.fileName}</p>
                                <p className="text-muted-foreground">
                                  {attachment.mimeType} •{" "}
                                  {formatFileSize(attachment.sizeBytes)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadMutation.mutate(attachment.id)}
                                disabled={isDownloading}
                              >
                                {isDownloading ? "Fetching..." : "Download"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {request.responseMessage ? (
                    <div className="bg-muted/40 rounded-md p-3 text-sm">
                      <p className="font-medium">Response</p>
                      <p className="text-muted-foreground">{request.responseMessage}</p>
                    </div>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveResponseId(request.id);
                      setResponseMessage(request.responseMessage ?? "");
                      setNextStatus(request.status);
                      setNextPriority(request.priority ?? "normal");
                      setSlaTargetAt(toDateTimeLocal(request.slaTargetAt));
                    }}
                  >
                    Respond
                  </Button>

                  {activeResponseId === request.id ? (
                    <div className="space-y-2">
                      <Label>Response</Label>
                      <Textarea
                        rows={3}
                        value={responseMessage}
                        onChange={(event) => setResponseMessage(event.target.value)}
                        placeholder="Add a response for the requester"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={nextStatus} onValueChange={setNextStatus}>
                          <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions
                              .filter((option) => option.value !== "all")
                              .map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Select value={nextPriority} onValueChange={setNextPriority}>
                          <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Set priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="datetime-local"
                          value={slaTargetAt}
                          onChange={(event) => setSlaTargetAt(event.target.value)}
                          className="sm:w-56"
                          placeholder="SLA target"
                        />
                        <Button size="sm" onClick={() => respondMutation.mutate()}>
                          Save response
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveResponseId(null);
                            setResponseMessage("");
                            setSlaTargetAt("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
