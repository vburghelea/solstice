import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Badge } from "~/components/ui/badge";
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
import { createSupportRequest } from "../support.mutations";
import { listMySupportRequests } from "../support.queries";

const categoryOptions = [
  { value: "question", label: "Question" },
  { value: "issue", label: "Issue" },
  { value: "feature_request", label: "Feature request" },
  { value: "feedback", label: "Feedback" },
];

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function SupportRequestsPanel() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useOrgContext();
  const [useOrganization, setUseOrganization] = useState(true);

  const form = useAppForm({
    defaultValues: {
      subject: "",
      message: "",
      category: "question",
    },
    onSubmit: async ({ value }) => {
      if (useOrganization && !activeOrganizationId) {
        toast.error("Select an organization to submit this request.");
        return;
      }

      await createSupportRequest({
        data: {
          subject: value.subject,
          message: value.message,
          category: value.category as
            | "question"
            | "issue"
            | "feature_request"
            | "feedback",
          organizationId: useOrganization
            ? (activeOrganizationId ?? undefined)
            : undefined,
        },
      });

      toast.success("Support request submitted.");
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["support", "my-requests"] });
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
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
