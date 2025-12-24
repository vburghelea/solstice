import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
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
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { listOrganizations } from "~/features/organizations/organizations.queries";
import { useAppForm } from "~/lib/hooks/useAppForm";
import {
  createSavedReport,
  deleteSavedReport,
  exportReport,
  updateSavedReport,
} from "../reports.mutations";
import { listSavedReports } from "../reports.queries";

const dataSourceOptions = [
  { value: "organizations", label: "Organizations" },
  { value: "reporting_submissions", label: "Reporting submissions" },
  { value: "form_submissions", label: "Form submissions" },
];

const exportTypeOptions = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

const parseJsonInput = (value: string) => {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const parseListInput = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

function SavedReportRow({
  report,
  onUpdated,
  onDeleted,
}: {
  report: {
    id: string;
    name: string;
    description: string | null;
    dataSource: string;
    organizationId: string | null;
    sharedWith: string[] | null;
    isOrgWide: boolean;
    filters: Record<string, unknown>;
    columns: string[] | null;
    sort: Record<string, unknown> | null;
  };
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useAppForm({
    defaultValues: {
      name: report.name,
      description: report.description ?? "",
      dataSource: report.dataSource,
      organizationId: report.organizationId ?? "",
      sharedWith: report.sharedWith?.join(", ") ?? "",
      isOrgWide: report.isOrgWide,
      filters: JSON.stringify(report.filters ?? {}, null, 2),
      columns: report.columns?.join(", ") ?? "",
      sort: JSON.stringify(report.sort ?? {}, null, 2),
    },
    onSubmit: async ({ value }) => {
      const filters = parseJsonInput(value.filters);
      const sort = parseJsonInput(value.sort);
      if (filters === null || sort === null) {
        toast.error("Filters or sort JSON is invalid.");
        return;
      }

      const updated = await updateSavedReport({
        data: {
          reportId: report.id,
          data: {
            name: value.name,
            description: value.description || undefined,
            dataSource: value.dataSource,
            organizationId: value.organizationId || undefined,
            sharedWith: parseListInput(value.sharedWith),
            isOrgWide: value.isOrgWide,
            filters: filters ?? undefined,
            columns: parseListInput(value.columns),
            sort: sort ?? undefined,
          },
        },
      });

      if (updated) {
        toast.success("Report updated.");
        setIsEditing(false);
        onUpdated();
      } else {
        toast.error("Failed to update report.");
      }
    },
  });

  return (
    <>
      <TableRow>
        <TableCell className="text-xs font-semibold">{report.name}</TableCell>
        <TableCell className="text-xs">{report.dataSource}</TableCell>
        <TableCell className="text-xs">
          {report.isOrgWide ? "Org-wide" : "Private"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? "Close" : "Edit"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDeleted}>
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isEditing ? (
        <TableRow>
          <TableCell colSpan={4} className="pt-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
              className="space-y-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <form.Field name="name">
                  {(field) => (
                    <Input
                      placeholder="Report name"
                      value={(field.state.value as string) ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </form.Field>
                <form.Field name="dataSource">
                  {(field) => (
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSourceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>
              <form.Field name="description">
                {(field) => (
                  <Input
                    placeholder="Description (optional)"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>
              <div className="grid gap-3 md:grid-cols-2">
                <form.Field name="organizationId">
                  {(field) => (
                    <Input
                      placeholder="Organization ID (optional)"
                      value={(field.state.value as string) ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </form.Field>
                <form.Field name="sharedWith">
                  {(field) => (
                    <Input
                      placeholder="Share with (comma-separated IDs)"
                      value={(field.state.value as string) ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </form.Field>
              </div>
              <form.Field name="filters">
                {(field) => (
                  <Textarea
                    rows={3}
                    placeholder='Filters JSON (e.g., {"status":"active"})'
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>
              <div className="grid gap-3 md:grid-cols-2">
                <form.Field name="columns">
                  {(field) => (
                    <Input
                      placeholder="Columns (comma-separated)"
                      value={(field.state.value as string) ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </form.Field>
                <form.Field name="sort">
                  {(field) => (
                    <Textarea
                      rows={3}
                      placeholder='Sort JSON (e.g., {"created_at":"desc"})'
                      value={(field.state.value as string) ?? ""}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  )}
                </form.Field>
              </div>
              <form.Field name="isOrgWide">
                {(field) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(field.state.value)}
                      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    />
                    Org-wide (share with all org members)
                  </label>
                )}
              </form.Field>
              <FormSubmitButton className="w-fit">Save changes</FormSubmitButton>
            </form>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function ReportBuilderShell() {
  const queryClient = useQueryClient();
  const { requestStepUp } = useStepUpPrompt();
  const handleStepUpError = useCallback(
    (error: unknown) => {
      const message = getStepUpErrorMessage(error);
      if (!message) return false;
      requestStepUp(message);
      return true;
    },
    [requestStepUp],
  );
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations", "list"],
    queryFn: () => listOrganizations({ data: { includeArchived: false } }),
  });
  const { data: reports = [] } = useQuery({
    queryKey: ["reports", "saved"],
    queryFn: () => listSavedReports({ data: {} }),
  });

  const exportMutation = useMutation({
    mutationFn: exportReport,
    onSuccess: (result, variables) => {
      if (!result?.data) return;
      const exportType =
        typeof variables === "object" && variables && "data" in variables
          ? (variables as { data?: { exportType?: "csv" | "excel" | "pdf" } }).data
              ?.exportType
          : undefined;
      const extension = exportType === "pdf" ? "pdf" : "csv";
      const blob = new Blob([result.data], {
        type: exportType === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-export.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      if (handleStepUpError(error)) return;
      const message = error instanceof Error ? error.message : "Failed to export report.";
      toast.error(message);
    },
  });

  const createForm = useAppForm({
    defaultValues: {
      name: "",
      description: "",
      dataSource: "",
      organizationId: "__all__",
      sharedWith: "",
      isOrgWide: false,
      filters: "",
      columns: "",
      sort: "",
    },
    onSubmit: async ({ value }) => {
      const filters = parseJsonInput(value.filters);
      const sort = parseJsonInput(value.sort);
      if (filters === null || sort === null) {
        toast.error("Filters or sort JSON is invalid.");
        return;
      }

      const created = await createSavedReport({
        data: {
          name: value.name,
          description: value.description || undefined,
          dataSource: value.dataSource,
          organizationId:
            value.organizationId === "__all__" ? undefined : value.organizationId,
          sharedWith: parseListInput(value.sharedWith),
          isOrgWide: value.isOrgWide,
          filters: filters ?? undefined,
          columns: parseListInput(value.columns),
          sort: sort ?? undefined,
        },
      });

      if (created) {
        toast.success("Report saved.");
        createForm.reset();
        await queryClient.invalidateQueries({ queryKey: ["reports", "saved"] });
      } else {
        toast.error("Failed to save report.");
      }
    },
  });

  const exportForm = useAppForm({
    defaultValues: {
      dataSource: "",
      exportType: "csv",
      filters: "",
      columns: "",
    },
    onSubmit: async ({ value }) => {
      const filters = parseJsonInput(value.filters);
      if (filters === null) {
        toast.error("Filters JSON is invalid.");
        return;
      }

      exportMutation.mutate({
        data: {
          dataSource: value.dataSource,
          exportType: value.exportType as "csv" | "excel" | "pdf",
          filters: filters ?? undefined,
          columns: parseListInput(value.columns),
        },
      });
    },
  });

  const normalizedReports = useMemo(() => reports, [reports]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export data</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void exportForm.handleSubmit();
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <exportForm.Field name="dataSource">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </exportForm.Field>
              <exportForm.Field name="exportType">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Export type" />
                    </SelectTrigger>
                    <SelectContent>
                      {exportTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </exportForm.Field>
            </div>
            <exportForm.Field name="columns">
              {(field) => (
                <Input
                  placeholder="Columns (comma-separated)"
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </exportForm.Field>
            <exportForm.Field name="filters">
              {(field) => (
                <Textarea
                  rows={3}
                  placeholder='Filters JSON (e.g., {"status":"active"})'
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </exportForm.Field>
            <FormSubmitButton className="w-fit">
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {normalizedReports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No saved reports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Sharing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedReports.map((report) => (
                  <SavedReportRow
                    key={report.id}
                    report={report}
                    onUpdated={() =>
                      queryClient.invalidateQueries({ queryKey: ["reports", "saved"] })
                    }
                    onDeleted={async () => {
                      await deleteSavedReport({ data: { reportId: report.id } });
                      await queryClient.invalidateQueries({
                        queryKey: ["reports", "saved"],
                      });
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create saved report</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void createForm.handleSubmit();
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <createForm.Field name="name">
                {(field) => (
                  <Input
                    placeholder="Report name"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </createForm.Field>
              <createForm.Field name="dataSource">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </createForm.Field>
            </div>
            <createForm.Field name="description">
              {(field) => (
                <Input
                  placeholder="Description (optional)"
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </createForm.Field>
            <div className="grid gap-3 md:grid-cols-2">
              <createForm.Field name="organizationId">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Organization scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All organizations</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </createForm.Field>
              <createForm.Field name="sharedWith">
                {(field) => (
                  <Input
                    placeholder="Share with (comma-separated IDs)"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </createForm.Field>
            </div>
            <createForm.Field name="filters">
              {(field) => (
                <Textarea
                  rows={3}
                  placeholder='Filters JSON (e.g., {"status":"active"})'
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </createForm.Field>
            <div className="grid gap-3 md:grid-cols-2">
              <createForm.Field name="columns">
                {(field) => (
                  <Input
                    placeholder="Columns (comma-separated)"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </createForm.Field>
              <createForm.Field name="sort">
                {(field) => (
                  <Textarea
                    rows={3}
                    placeholder='Sort JSON (e.g., {"created_at":"desc"})'
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </createForm.Field>
            </div>
            <createForm.Field name="isOrgWide">
              {(field) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(field.state.value)}
                    onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                  />
                  Org-wide (share with all org members)
                </label>
              )}
            </createForm.Field>
            <FormSubmitButton className="w-fit">Save report</FormSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
