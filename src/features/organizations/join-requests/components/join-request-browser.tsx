import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { getTenantConfig } from "~/tenant";
import { cancelJoinRequest, createJoinRequest } from "../join-requests.mutations";
import {
  listDiscoverableOrganizations,
  listMyJoinRequests,
} from "../join-requests.queries";
import type {
  DiscoverableOrganization,
  JoinRequestSummary,
} from "../join-requests.types";

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusLabel = (status: string) => status.replace(/_/g, " ");

export function JoinRequestBrowser() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<DiscoverableOrganization | null>(null);
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations", "discoverable"],
    queryFn: () => listDiscoverableOrganizations({ data: null }),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["organizations", "join-requests", "me"],
    queryFn: () => listMyJoinRequests({ data: null }),
  });

  const rateLimitedCreateJoinRequest = useRateLimitedServerFn(createJoinRequest, {
    type: "mutation",
  });

  const createMutation = useMutation({
    mutationFn: (payload: { organizationId: string; message?: string }) =>
      rateLimitedCreateJoinRequest({ data: payload }),
    onSuccess: () => {
      toast.success("Join request submitted.");
      setDialogOpen(false);
      setMessage("");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "join-requests", "me"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send request.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelJoinRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Join request cancelled.");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "join-requests", "me"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel request.");
    },
  });

  const requestByOrg = useMemo(() => {
    const map = new Map<string, JoinRequestSummary>();
    requests.forEach((request) => {
      if (!map.has(request.organizationId)) {
        map.set(request.organizationId, request);
      }
    });
    return map;
  }, [requests]);

  const filteredOrganizations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return organizations;
    return organizations.filter((org) => org.name.toLowerCase().includes(normalized));
  }, [organizations, search]);

  const orgLabels = getTenantConfig().orgLabels;

  const openDialog = (org: DiscoverableOrganization) => {
    setSelectedOrg(org);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedOrg(null);
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse organizations</CardTitle>
          <CardDescription>
            Request access to a discoverable organization to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search organizations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading organizations...</p>
          ) : filteredOrganizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredOrganizations.map((org) => {
                const request = requestByOrg.get(org.id);
                const requestPending = request?.status === "pending";
                const requestsClosed = !org.joinRequestsEnabled;

                return (
                  <Card key={org.id} className="border-dashed">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <CardDescription>
                            {orgLabels[org.type as keyof typeof orgLabels] ?? org.type}
                          </CardDescription>
                        </div>
                        {request ? (
                          <Badge variant="outline" className="capitalize">
                            {statusLabel(request.status)}
                          </Badge>
                        ) : null}
                      </div>
                      {requestsClosed ? (
                        <p className="text-muted-foreground text-xs">
                          Join requests are currently closed.
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => openDialog(org)}
                        disabled={
                          requestsClosed || requestPending || createMutation.isPending
                        }
                      >
                        {requestPending ? "Request pending" : "Request to join"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your join requests</CardTitle>
          <CardDescription>
            Track the status of organization access requests you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No join requests yet.</p>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{request.organizationName}</p>
                  <p className="text-muted-foreground text-xs">
                    Requested {request.requestedRole} • {formatDate(request.createdAt)}
                  </p>
                  {request.message ? (
                    <p className="text-muted-foreground text-sm">{request.message}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {statusLabel(request.status)}
                  </Badge>
                  {request.status === "pending" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate(request.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request access</DialogTitle>
            <DialogDescription>
              Add an optional note to accompany your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium">
              Organization: {selectedOrg?.name ?? "Unknown"}
            </p>
            <Textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Optional message for the admin"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!selectedOrg) return;
                const trimmedMessage = message.trim();
                createMutation.mutate({
                  organizationId: selectedOrg.id,
                  ...(trimmedMessage ? { message: trimmedMessage } : {}),
                });
              }}
              disabled={!selectedOrg || createMutation.isPending}
            >
              {createMutation.isPending ? "Sending..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
