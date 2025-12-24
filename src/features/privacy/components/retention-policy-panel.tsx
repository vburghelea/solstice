import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { upsertRetentionPolicy } from "../privacy.mutations";
import { listRetentionPolicies } from "../privacy.queries";

type RetentionFormValues = {
  dataType: string;
  retentionDays: string;
  archiveAfterDays: string;
  purgeAfterDays: string;
  legalHold: boolean;
};

function normalizeNumberInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function RetentionPolicyCreate() {
  const queryClient = useQueryClient();
  const form = useAppForm({
    defaultValues: {
      dataType: "",
      retentionDays: "365",
      archiveAfterDays: "",
      purgeAfterDays: "",
      legalHold: false,
    },
    onSubmit: async ({ value }) => {
      const retentionDays = normalizeNumberInput(value.retentionDays);
      if (!retentionDays || retentionDays <= 0) {
        toast.error("Retention days must be a positive number.");
        return;
      }

      const result = await upsertRetentionPolicy({
        data: {
          dataType: value.dataType.trim(),
          retentionDays,
          archiveAfterDays: normalizeNumberInput(value.archiveAfterDays),
          purgeAfterDays: normalizeNumberInput(value.purgeAfterDays),
          legalHold: value.legalHold,
        },
      });

      if (!result) {
        toast.error("Failed to save retention policy.");
        return;
      }

      toast.success("Retention policy saved.");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["privacy", "retention"] });
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
      <p className="text-sm font-semibold">Create retention policy</p>
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="dataType">
          {(field) => (
            <Input
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Data type (e.g., audit_logs)"
            />
          )}
        </form.Field>
        <form.Field name="retentionDays">
          {(field) => (
            <Input
              type="number"
              min={1}
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Retention days"
            />
          )}
        </form.Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="archiveAfterDays">
          {(field) => (
            <Input
              type="number"
              min={0}
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Archive after (days)"
            />
          )}
        </form.Field>
        <form.Field name="purgeAfterDays">
          {(field) => (
            <Input
              type="number"
              min={0}
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Purge after (days)"
            />
          )}
        </form.Field>
      </div>
      <form.Field name="legalHold">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(field.state.value)}
              onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
            />
            Legal hold (skip purge)
          </label>
        )}
      </form.Field>
      <Button type="submit">Save policy</Button>
    </form>
  );
}

function RetentionPolicyRow({
  policy,
}: {
  policy: {
    id: string;
    dataType: string;
    retentionDays: number;
    archiveAfterDays: number | null;
    purgeAfterDays: number | null;
    legalHold: boolean;
  };
}) {
  const queryClient = useQueryClient();
  const form = useAppForm<RetentionFormValues>({
    defaultValues: {
      dataType: policy.dataType,
      retentionDays: String(policy.retentionDays),
      archiveAfterDays: policy.archiveAfterDays ? String(policy.archiveAfterDays) : "",
      purgeAfterDays: policy.purgeAfterDays ? String(policy.purgeAfterDays) : "",
      legalHold: policy.legalHold,
    },
    onSubmit: async ({ value }) => {
      const retentionDays = normalizeNumberInput(value.retentionDays);
      if (!retentionDays || retentionDays <= 0) {
        toast.error("Retention days must be a positive number.");
        return;
      }

      const result = await upsertRetentionPolicy({
        data: {
          dataType: policy.dataType,
          retentionDays,
          archiveAfterDays: normalizeNumberInput(value.archiveAfterDays),
          purgeAfterDays: normalizeNumberInput(value.purgeAfterDays),
          legalHold: value.legalHold,
        },
      });

      if (!result) {
        toast.error("Failed to update retention policy.");
        return;
      }

      toast.success("Retention policy updated.");
      await queryClient.invalidateQueries({ queryKey: ["privacy", "retention"] });
    },
  });

  return (
    <TableRow>
      <TableCell className="text-xs font-semibold">{policy.dataType}</TableCell>
      <TableCell>
        <form.Field name="retentionDays">
          {(field) => (
            <Input
              type="number"
              min={1}
              className="h-8"
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="archiveAfterDays">
          {(field) => (
            <Input
              type="number"
              min={0}
              className="h-8"
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="purgeAfterDays">
          {(field) => (
            <Input
              type="number"
              min={0}
              className="h-8"
              value={(field.state.value as string) ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="legalHold">
          {(field) => (
            <Checkbox
              checked={Boolean(field.state.value)}
              onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" size="sm" onClick={() => void form.handleSubmit()}>
          Update
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function RetentionPolicyPanel() {
  const { data: policies = [] } = useQuery({
    queryKey: ["privacy", "retention"],
    queryFn: () => listRetentionPolicies(),
  });

  const rows = useMemo(() => policies, [policies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RetentionPolicyCreate />
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No retention policies yet.</p>
        ) : (
          <div>
            <Label className="text-sm font-semibold">Existing policies</Label>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Data type</TableHead>
                  <TableHead>Retention (days)</TableHead>
                  <TableHead>Archive after</TableHead>
                  <TableHead>Purge after</TableHead>
                  <TableHead>Legal hold</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((policy) => (
                  <RetentionPolicyRow key={policy.id} policy={policy} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
