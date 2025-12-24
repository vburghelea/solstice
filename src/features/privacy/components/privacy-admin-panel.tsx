import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  applyPrivacyErasure,
  generatePrivacyExport,
  updatePrivacyRequest,
} from "../privacy.mutations";
import { getPrivacyExportDownloadUrl, listAllPrivacyRequests } from "../privacy.queries";

const statusOptions = ["pending", "processing", "completed", "rejected"];

type UpdateState = {
  status: string;
  resultUrl: string;
  resultNotes: string;
  rejectionReason: string;
};

export function PrivacyAdminPanel() {
  const queryClient = useQueryClient();
  const [updates, setUpdates] = useState<Record<string, UpdateState>>({});

  const { data = [] } = useQuery({
    queryKey: ["privacy", "admin", "requests"],
    queryFn: () => listAllPrivacyRequests(),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      requestId: string;
      status: string;
      resultUrl?: string;
      resultNotes?: string;
      rejectionReason?: string;
    }) => updatePrivacyRequest({ data: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["privacy", "admin", "requests"],
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: (requestId: string) => generatePrivacyExport({ data: { requestId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["privacy", "admin", "requests"],
      });
    },
  });

  const erasureMutation = useMutation({
    mutationFn: (payload: { requestId: string; reason?: string }) =>
      applyPrivacyErasure({ data: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["privacy", "admin", "requests"],
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (requestId: string) =>
      getPrivacyExportDownloadUrl({ data: { requestId } }),
    onSuccess: (url) => {
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
  });

  const getUpdateState = (requestId: string, status: string): UpdateState =>
    updates[requestId] ?? {
      status,
      resultUrl: "",
      resultNotes: "",
      rejectionReason: "",
    };

  const updateState = (requestId: string, next: Partial<UpdateState>) => {
    setUpdates((prev) => ({
      ...prev,
      [requestId]: { ...getUpdateState(requestId, "pending"), ...next },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DSAR Processing</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm">
                  No privacy requests.
                </TableCell>
              </TableRow>
            ) : (
              data.map((request) => {
                const state = getUpdateState(request.id, request.status);
                return (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs">{request.userId}</TableCell>
                    <TableCell className="text-xs">{request.type}</TableCell>
                    <TableCell className="text-xs">
                      <Select
                        value={state.status}
                        onValueChange={(value) =>
                          updateState(request.id, { status: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="space-y-2">
                      <Input
                        placeholder="Result URL"
                        value={state.resultUrl}
                        onChange={(event) =>
                          updateState(request.id, { resultUrl: event.target.value })
                        }
                      />
                      <Input
                        placeholder="Result notes"
                        value={state.resultNotes}
                        onChange={(event) =>
                          updateState(request.id, { resultNotes: event.target.value })
                        }
                      />
                      <Input
                        placeholder="Rejection reason"
                        value={state.rejectionReason}
                        onChange={(event) =>
                          updateState(request.id, {
                            rejectionReason: event.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            updateMutation.mutate({
                              requestId: request.id,
                              status: state.status,
                              ...(state.resultUrl ? { resultUrl: state.resultUrl } : {}),
                              ...(state.resultNotes
                                ? { resultNotes: state.resultNotes }
                                : {}),
                              ...(state.rejectionReason
                                ? { rejectionReason: state.rejectionReason }
                                : {}),
                            });
                          }}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? "Updating..." : "Update"}
                        </Button>
                        {request.type === "export" || request.type === "access" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => exportMutation.mutate(request.id)}
                            disabled={exportMutation.isPending}
                          >
                            {exportMutation.isPending
                              ? "Generating..."
                              : "Generate export"}
                          </Button>
                        ) : null}
                        {request.type === "erasure" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              erasureMutation.mutate({
                                requestId: request.id,
                                ...(state.resultNotes
                                  ? { reason: state.resultNotes }
                                  : {}),
                              })
                            }
                            disabled={erasureMutation.isPending}
                          >
                            {erasureMutation.isPending ? "Erasing..." : "Apply erasure"}
                          </Button>
                        ) : null}
                        {request.resultUrl ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadMutation.mutate(request.id)}
                            disabled={downloadMutation.isPending}
                          >
                            {downloadMutation.isPending
                              ? "Preparing..."
                              : "Download export"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
