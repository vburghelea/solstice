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
import { listSupportRequestsAdmin } from "../support.queries";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function SupportAdminPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [nextStatus, setNextStatus] = useState("resolved");

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
            },
          })
        : Promise.resolve(null),
    onSuccess: () => {
      toast.success("Response saved.");
      setResponseMessage("");
      setActiveResponseId(null);
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
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {request.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{request.message}</p>

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
                        <Button size="sm" onClick={() => respondMutation.mutate()}>
                          Save response
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveResponseId(null)}
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
