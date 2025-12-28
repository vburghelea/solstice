import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { resolveJoinRequest } from "../join-requests.mutations";
import { listOrganizationJoinRequests } from "../join-requests.queries";

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function JoinRequestsAdminPanel({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [notesByRequestId, setNotesByRequestId] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["organizations", "join-requests", organizationId],
    queryFn: () =>
      listOrganizationJoinRequests({
        data: { organizationId, status: "pending" },
      }),
    enabled: Boolean(organizationId),
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: { requestId: string; status: "approved" | "denied" }) =>
      resolveJoinRequest({
        data: {
          requestId: payload.requestId,
          status: payload.status,
          resolutionNotes: notesByRequestId[payload.requestId]?.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Join request updated.");
      setNotesByRequestId({});
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "join-requests", organizationId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update request.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending join requests</CardTitle>
        <CardDescription>Review incoming organization access requests.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {request.userName ?? "Unknown user"}
                      </p>
                      <p className="text-muted-foreground text-xs">{request.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.requestedRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm whitespace-normal">
                    {request.message || "No message"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[220px] whitespace-normal">
                    <Textarea
                      rows={2}
                      value={notesByRequestId[request.id] ?? ""}
                      onChange={(event) =>
                        setNotesByRequestId((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional note"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          resolveMutation.mutate({
                            requestId: request.id,
                            status: "approved",
                          })
                        }
                        disabled={resolveMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          resolveMutation.mutate({
                            requestId: request.id,
                            status: "denied",
                          })
                        }
                        disabled={resolveMutation.isPending}
                      >
                        Deny
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
