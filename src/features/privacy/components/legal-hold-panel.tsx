import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { createLegalHold, releaseLegalHold } from "../privacy.mutations";
import { listLegalHolds } from "../privacy.queries";

const scopeOptions = ["user", "organization", "record"] as const;

type LegalHoldFormValues = {
  scopeType: (typeof scopeOptions)[number];
  scopeId: string;
  dataType: string;
  reason: string;
};

function LegalHoldCreate() {
  const queryClient = useQueryClient();
  const form = useAppForm<LegalHoldFormValues>({
    defaultValues: {
      scopeType: "user",
      scopeId: "",
      dataType: "",
      reason: "",
    },
    onSubmit: async ({ value }) => {
      const scopeId = value.scopeId.trim();
      if (!scopeId) {
        toast.error("Scope ID is required.");
        return;
      }

      const reason = value.reason.trim();
      if (!reason) {
        toast.error("Reason is required.");
        return;
      }

      const result = await createLegalHold({
        data: {
          scopeType: value.scopeType,
          scopeId,
          dataType: value.dataType.trim() || undefined,
          reason,
        },
      });

      if (!result) {
        toast.error("Failed to create legal hold.");
        return;
      }

      toast.success("Legal hold created.");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["privacy", "legal-holds"] });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-3"
    >
      <p className="text-sm font-semibold">Create legal hold</p>
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="scopeType">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(value) =>
                field.handleChange(value as LegalHoldFormValues["scopeType"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Scope type" />
              </SelectTrigger>
              <SelectContent>
                {scopeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form.Field>
        <form.Field name="scopeId">
          {(field) => (
            <Input
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Scope ID (user/org/record)"
            />
          )}
        </form.Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="dataType">
          {(field) => (
            <Input
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Data type (optional)"
            />
          )}
        </form.Field>
        <form.Field name="reason">
          {(field) => (
            <Input
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Reason"
            />
          )}
        </form.Field>
      </div>
      <Button type="submit">Create hold</Button>
    </form>
  );
}

export function LegalHoldPanel() {
  const queryClient = useQueryClient();
  const { data: holds = [] } = useQuery({
    queryKey: ["privacy", "legal-holds"],
    queryFn: () => listLegalHolds(),
  });

  const releaseMutation = useMutation({
    mutationFn: (holdId: string) => releaseLegalHold({ data: { holdId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privacy", "legal-holds"] });
    },
  });

  const rows = useMemo(() => holds, [holds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Holds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <LegalHoldCreate />
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No legal holds yet.</p>
        ) : (
          <div>
            <Label className="text-sm font-semibold">Active and released holds</Label>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Data type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Released</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((hold) => (
                  <TableRow key={hold.id}>
                    <TableCell className="text-xs">
                      {hold.scopeType}: {hold.scopeId}
                    </TableCell>
                    <TableCell className="text-xs">{hold.dataType ?? "All"}</TableCell>
                    <TableCell className="text-xs">{hold.reason}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(hold.appliedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {hold.releasedAt
                        ? new Date(hold.releasedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {hold.releasedAt ? null : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => releaseMutation.mutate(hold.id)}
                          disabled={releaseMutation.isPending}
                        >
                          {releaseMutation.isPending ? "Releasing..." : "Release"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
