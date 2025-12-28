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
import { Textarea } from "~/components/ui/textarea";
import { createPrivacyRequest } from "../privacy.mutations";
import { listPrivacyRequests } from "../privacy.queries";

export function PrivacyDashboard() {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState("access");
  const [requestDetails, setRequestDetails] = useState("");
  const isCorrection = requestType === "correction";

  const { data = [] } = useQuery({
    queryKey: ["privacy", "requests"],
    queryFn: () => listPrivacyRequests(),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      createPrivacyRequest({
        data: {
          type: requestType,
          ...(isCorrection && requestDetails.trim()
            ? { details: { correction: requestDetails.trim() } }
            : {}),
        },
      }),
    onSuccess: () => {
      setRequestDetails("");
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
          {isCorrection ? (
            <div className="min-w-[260px] flex-1">
              <label className="text-sm font-medium">Correction details</label>
              <Textarea
                className="mt-2"
                value={requestDetails}
                onChange={(event) => setRequestDetails(event.target.value)}
                placeholder="Describe what needs to be corrected."
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() => requestMutation.mutate()}
            disabled={
              requestMutation.isPending || (isCorrection && !requestDetails.trim())
            }
          >
            {requestMutation.isPending ? "Submitting..." : "Submit request"}
          </Button>
        </div>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No privacy requests yet.</p>
        ) : (
          data.map((request) => {
            const correctionDetails =
              request.type === "correction" &&
              request.details &&
              typeof request.details === "object" &&
              "correction" in request.details
                ? String(
                    (
                      request.details as {
                        correction?: unknown;
                      }
                    ).correction ?? "",
                  )
                : "";

            return (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{request.type}</p>
                  <p className="text-muted-foreground text-xs">{request.status}</p>
                  {correctionDetails ? (
                    <p className="text-muted-foreground text-xs">{correctionDetails}</p>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
