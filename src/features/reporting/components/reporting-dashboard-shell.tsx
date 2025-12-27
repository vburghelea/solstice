import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
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
import { Textarea } from "~/components/ui/textarea";
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { listForms } from "~/features/forms/forms.queries";
import { listOrganizations } from "~/features/organizations/organizations.queries";
import { useAppForm } from "~/lib/hooks/useAppForm";
import {
  createReportingCycle,
  createReportingTask,
  updateReportingSubmission,
} from "../reporting.mutations";
import {
  listReportingCycles,
  listReportingOverview,
  listReportingSubmissionHistory,
} from "../reporting.queries";

const organizationTypeOptions = [
  { value: "governing_body", label: "Governing body" },
  { value: "pso", label: "PSO" },
  { value: "league", label: "League" },
  { value: "club", label: "Club" },
  { value: "affiliate", label: "Affiliate" },
];

const submissionStatusOptions = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
  { value: "overdue", label: "Overdue" },
  { value: "rejected", label: "Rejected" },
];

export function ReportingDashboardShell() {
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
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

  const { data: forms = [] } = useQuery({
    queryKey: ["forms", "list"],
    queryFn: () => listForms({ data: {} }),
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["reporting", "cycles"],
    queryFn: () => listReportingCycles(),
  });

  const { data: overview = [] } = useQuery({
    queryKey: ["reporting", "overview"],
    queryFn: () => listReportingOverview({ data: {} }),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["reporting", "history", selectedSubmissionId],
    queryFn: () =>
      selectedSubmissionId
        ? listReportingSubmissionHistory({ data: { submissionId: selectedSubmissionId } })
        : [],
    enabled: Boolean(selectedSubmissionId),
  });

  const selectedSubmission = useMemo(
    () => overview.find((item) => item.submissionId === selectedSubmissionId) ?? null,
    [overview, selectedSubmissionId],
  );

  const cycleForm = useAppForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const created = await createReportingCycle({
          data: {
            name: value.name,
            description: value.description || undefined,
            startDate: value.startDate,
            endDate: value.endDate,
          },
        });

        if (created) {
          cycleForm.reset();
          await queryClient.invalidateQueries({ queryKey: ["reporting", "cycles"] });
        }
      } catch (error) {
        if (handleStepUpError(error)) return;
        const message =
          error instanceof Error ? error.message : "Failed to create reporting cycle.";
        toast.error(message);
      }
    },
  });

  const taskForm = useAppForm({
    defaultValues: {
      cycleId: "",
      formId: "",
      organizationId: "__all__",
      organizationType: "__all__",
      title: "",
      description: "",
      dueDate: "",
      reminderDays: "14,7,3,1",
    },
    onSubmit: async ({ value }) => {
      try {
        const reminderDays = value.reminderDays
          .split(",")
          .map((entry) => Number(entry.trim()))
          .filter((entry) => !Number.isNaN(entry));

        const created = await createReportingTask({
          data: {
            cycleId: value.cycleId,
            formId: value.formId,
            organizationId:
              value.organizationId === "__all__" ? undefined : value.organizationId,
            organizationType:
              value.organizationType === "__all__" ? undefined : value.organizationType,
            title: value.title,
            description: value.description || undefined,
            dueDate: value.dueDate,
            reminderConfig: { days_before: reminderDays },
          },
        });

        if (created) {
          taskForm.reset();
          await queryClient.invalidateQueries({ queryKey: ["reporting", "overview"] });
        }
      } catch (error) {
        if (handleStepUpError(error)) return;
        const message =
          error instanceof Error ? error.message : "Failed to create reporting task.";
        toast.error(message);
      }
    },
  });

  const reviewForm = useAppForm({
    defaultValues: {
      status: "",
      reviewNotes: "",
      formSubmissionId: "",
      formSubmissionVersionId: "",
    },
    onSubmit: async ({ value }) => {
      if (!selectedSubmission) return;
      try {
        await updateReportingSubmission({
          data: {
            submissionId: selectedSubmission.submissionId,
            status: value.status,
            reviewNotes: value.reviewNotes || undefined,
            formSubmissionId: value.formSubmissionId || undefined,
            formSubmissionVersionId: value.formSubmissionVersionId || undefined,
          },
        });
        await queryClient.invalidateQueries({ queryKey: ["reporting", "overview"] });
        await queryClient.invalidateQueries({ queryKey: ["reporting", "history"] });
      } catch (error) {
        if (handleStepUpError(error)) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update reporting submission.";
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    if (selectedSubmission) {
      reviewForm.reset({
        status: selectedSubmission.status,
        reviewNotes: "",
        formSubmissionId: selectedSubmission.formSubmissionId ?? "",
        formSubmissionVersionId: "",
      });
    }
  }, [reviewForm, selectedSubmission]);

  const overdueIds = useMemo(() => {
    const now = new Date();
    return new Set(
      overview
        .filter((item) => new Date(item.dueDate) < now && item.status !== "submitted")
        .map((item) => item.submissionId),
    );
  }, [overview]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create reporting cycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void cycleForm.handleSubmit();
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <cycleForm.Field name="name">
                {(field) => (
                  <Input
                    placeholder="Cycle name"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </cycleForm.Field>
              <cycleForm.Field name="description">
                {(field) => (
                  <Input
                    placeholder="Description (optional)"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </cycleForm.Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <cycleForm.Field name="startDate">
                {(field) => (
                  <Input
                    type="date"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </cycleForm.Field>
              <cycleForm.Field name="endDate">
                {(field) => (
                  <Input
                    type="date"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </cycleForm.Field>
            </div>
            <FormSubmitButton className="w-fit">Create cycle</FormSubmitButton>
          </form>
          <div className="space-y-1 text-sm">
            {cycles.length === 0 ? (
              <p className="text-muted-foreground">No cycles yet.</p>
            ) : (
              cycles.map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between">
                  <span className="font-semibold">{cycle.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(cycle.startDate).toLocaleDateString()} →{" "}
                    {new Date(cycle.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign reporting task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void taskForm.handleSubmit();
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <taskForm.Field name="cycleId">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </taskForm.Field>
              <taskForm.Field name="formId">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Form" />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </taskForm.Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <taskForm.Field name="organizationId">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Specific organization (optional)" />
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
              </taskForm.Field>
              <taskForm.Field name="organizationType">
                {(field) => (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Organization type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All types</SelectItem>
                      {organizationTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </taskForm.Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <taskForm.Field name="title">
                {(field) => (
                  <Input
                    placeholder="Task title"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </taskForm.Field>
              <taskForm.Field name="dueDate">
                {(field) => (
                  <Input
                    type="date"
                    value={(field.state.value as string) ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </taskForm.Field>
            </div>
            <taskForm.Field name="description">
              {(field) => (
                <Textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </taskForm.Field>
            <taskForm.Field name="reminderDays">
              {(field) => (
                <Input
                  placeholder="Reminder days before due date (comma-separated)"
                  value={(field.state.value as string) ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </taskForm.Field>
            <FormSubmitButton className="w-fit">Create task</FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporting submissions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            {overview.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.map((item) => (
                    <TableRow
                      key={item.submissionId}
                      className={`cursor-pointer ${overdueIds.has(item.submissionId) ? "bg-red-50" : ""}`}
                      onClick={() => setSelectedSubmissionId(item.submissionId)}
                    >
                      <TableCell className="text-xs font-semibold">
                        {item.organizationName}
                      </TableCell>
                      <TableCell className="text-xs">{item.taskTitle}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-3">
            {selectedSubmission ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-muted-foreground space-y-1 text-xs">
                    <p>Organization: {selectedSubmission.organizationName}</p>
                    <p>Task: {selectedSubmission.taskTitle}</p>
                    <p>Cycle: {selectedSubmission.cycleName}</p>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void reviewForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <reviewForm.Field name="status">
                      {(field) => (
                        <Select
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {submissionStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </reviewForm.Field>
                    <reviewForm.Field name="reviewNotes">
                      {(field) => (
                        <Textarea
                          rows={3}
                          placeholder="Review notes (optional)"
                          value={(field.state.value as string) ?? ""}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                        />
                      )}
                    </reviewForm.Field>
                    <reviewForm.Field name="formSubmissionId">
                      {(field) => (
                        <Input
                          placeholder="Form submission ID (optional)"
                          value={(field.state.value as string) ?? ""}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                        />
                      )}
                    </reviewForm.Field>
                    <reviewForm.Field name="formSubmissionVersionId">
                      {(field) => (
                        <Input
                          placeholder="Submission version ID (optional)"
                          value={(field.state.value as string) ?? ""}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                        />
                      )}
                    </reviewForm.Field>
                    <FormSubmitButton className="w-full">Update status</FormSubmitButton>
                  </form>

                  <div>
                    <Label className="text-sm font-semibold">History</Label>
                    {history.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No history yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2 text-xs">
                        {history.map((entry) => (
                          <div key={entry.id} className="flex justify-between">
                            <span>{entry.action}</span>
                            <span className="text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground text-sm">
                Select a submission to review.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
