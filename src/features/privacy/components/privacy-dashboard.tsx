import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createPrivacyRequest } from "../privacy.mutations";
import { listPrivacyRequests } from "../privacy.queries";

export function PrivacyDashboard() {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState("access");

  const { data = [] } = useQuery({
    queryKey: ["privacy", "requests"],
    queryFn: () => listPrivacyRequests(),
  });

  const requestMutation = useMutation({
    mutationFn: () => createPrivacyRequest({ data: { type: requestType } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privacy", "requests"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label className="text-sm font-medium">New request</label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="erasure">Erasure</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? "Submitting..." : "Submit request"}
          </Button>
        </div>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No privacy requests yet.</p>
        ) : (
          data.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold">{request.type}</p>
                <p className="text-muted-foreground text-xs">{request.status}</p>
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
