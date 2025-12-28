import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "~/components/ui/textarea";
import {
  applyPrivacyCorrection,
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
  correctionName: string;
  correctionEmail: string;
  correctionPhone: string;
  correctionDateOfBirth: string;
  correctionGender: string;
  correctionPronouns: string;
  correctionEmergencyContact: string;
  correctionPrivacySettings: string;
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

  const correctionMutation = useMutation({
    mutationFn: (payload: {
      requestId: string;
      corrections: Record<string, unknown>;
      notes?: string;
    }) => applyPrivacyCorrection({ data: payload }),
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
        return;
      }
      toast.error("Export is not available for download.");
    },
    onError: () => {
      toast.error("Failed to generate export download link.");
    },
  });

  const getUpdateState = (requestId: string, status: string): UpdateState =>
    updates[requestId] ?? {
      status,
      resultUrl: "",
      resultNotes: "",
      rejectionReason: "",
      correctionName: "",
      correctionEmail: "",
      correctionPhone: "",
      correctionDateOfBirth: "",
      correctionGender: "",
      correctionPronouns: "",
      correctionEmergencyContact: "",
      correctionPrivacySettings: "",
    };

  const updateState = (requestId: string, next: Partial<UpdateState>) => {
    setUpdates((prev) => ({
      ...prev,
      [requestId]: { ...getUpdateState(requestId, "pending"), ...next },
    }));
  };

  const parseJsonInput = <T,>(value: string, label: string): T | null => {
    try {
      return JSON.parse(value) as T;
    } catch {
      toast.error(`Invalid ${label} JSON.`);
      return null;
    }
  };

  const buildCorrections = (state: UpdateState) => {
    const corrections: Record<string, unknown> = {};

    if (state.correctionName.trim()) {
      corrections["name"] = state.correctionName.trim();
    }
    if (state.correctionEmail.trim()) {
      corrections["email"] = state.correctionEmail.trim();
    }
    if (state.correctionPhone.trim()) {
      corrections["phone"] = state.correctionPhone.trim();
    }
    if (state.correctionDateOfBirth.trim()) {
      corrections["dateOfBirth"] = state.correctionDateOfBirth.trim();
    }
    if (state.correctionGender.trim()) {
      corrections["gender"] = state.correctionGender.trim();
    }
    if (state.correctionPronouns.trim()) {
      corrections["pronouns"] = state.correctionPronouns.trim();
    }
    if (state.correctionEmergencyContact.trim()) {
      const parsed = parseJsonInput(
        state.correctionEmergencyContact,
        "emergency contact",
      );
      if (!parsed) return null;
      corrections["emergencyContact"] = parsed;
    }
    if (state.correctionPrivacySettings.trim()) {
      const parsed = parseJsonInput(state.correctionPrivacySettings, "privacy settings");
      if (!parsed) return null;
      corrections["privacySettings"] = parsed;
    }

    return corrections;
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
                const expiresAt = request.resultExpiresAt
                  ? new Date(request.resultExpiresAt)
                  : null;
                const isExpired = expiresAt ? expiresAt < new Date() : false;
                const canDownload =
                  Boolean(request.resultUrl) &&
                  request.status === "completed" &&
                  !isExpired;
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
                        placeholder={
                          request.type === "correction"
                            ? "Correction notes"
                            : "Result notes"
                        }
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
                      {request.type === "correction" && request.details ? (
                        <Textarea
                          readOnly
                          value={
                            typeof request.details === "object" &&
                            request.details &&
                            "correction" in request.details
                              ? String(
                                  (
                                    request.details as {
                                      correction?: unknown;
                                    }
                                  ).correction ?? "",
                                )
                              : ""
                          }
                          className="text-xs"
                        />
                      ) : null}
                      {request.type === "correction" ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input
                            placeholder="Corrected name"
                            value={state.correctionName}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionName: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Corrected email"
                            value={state.correctionEmail}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionEmail: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Corrected phone"
                            value={state.correctionPhone}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionPhone: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Corrected DOB (YYYY-MM-DD)"
                            value={state.correctionDateOfBirth}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionDateOfBirth: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Corrected gender"
                            value={state.correctionGender}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionGender: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Corrected pronouns"
                            value={state.correctionPronouns}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionPronouns: event.target.value,
                              })
                            }
                          />
                          <Textarea
                            placeholder="Emergency contact JSON"
                            value={state.correctionEmergencyContact}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionEmergencyContact: event.target.value,
                              })
                            }
                          />
                          <Textarea
                            placeholder="Privacy settings JSON"
                            value={state.correctionPrivacySettings}
                            onChange={(event) =>
                              updateState(request.id, {
                                correctionPrivacySettings: event.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}
                      {request.resultExpiresAt ? (
                        <p className="text-muted-foreground text-xs">
                          Export expires {expiresAt?.toLocaleString()}
                          {isExpired ? " (expired)" : ""}
                        </p>
                      ) : null}
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
                        {request.type === "correction" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const corrections = buildCorrections(state);
                              if (!corrections) return;
                              if (Object.keys(corrections).length === 0) {
                                toast.error("Add at least one correction field.");
                                return;
                              }
                              correctionMutation.mutate({
                                requestId: request.id,
                                corrections,
                                ...(state.resultNotes
                                  ? { notes: state.resultNotes }
                                  : {}),
                              });
                            }}
                            disabled={correctionMutation.isPending}
                          >
                            {correctionMutation.isPending
                              ? "Applying..."
                              : "Apply correction"}
                          </Button>
                        ) : null}
                        {canDownload ? (
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
