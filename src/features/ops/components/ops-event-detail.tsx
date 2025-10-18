import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  subDays,
} from "date-fns";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  FilterIcon,
  MapPinIcon,
  RefreshCwIcon,
  SparklesIcon,
  StickyNoteIcon,
  Users2Icon,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { getEvent } from "~/features/events/events.queries";
import type {
  EventOperationResult,
  EventWithDetails,
} from "~/features/events/events.types";
import { opsCapacityThreshold } from "~/features/ops/components/use-ops-events-data";
import { useCommonTranslation, useOpsTranslation } from "~/hooks/useTypedTranslation";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { useLocalStorage } from "~/shared/hooks/useLocalStorage";
import { cn } from "~/shared/lib/utils";

const getTaskStatusLabels = (t: (key: string) => string) => ({
  todo: t("task_status.todo"),
  in_progress: t("task_status.in_progress"),
  blocked: t("task_status.blocked"),
  done: t("task_status.done"),
});

const TASK_STATUS_BADGE: Record<
  OpsTaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  todo: "outline",
  in_progress: "secondary",
  blocked: "destructive",
  done: "default",
};

// Will be replaced with translation key during component render

export type OpsTaskStatus = "todo" | "in_progress" | "blocked" | "done";

interface OpsTaskDefinition {
  id: string;
  title: string;
  description: string;
  defaultOwner: string;
  ownerOptions: string[];
  category: "launch_readiness" | "logistics" | "marketing" | "post_event" | "staffing";
  defaultStatus: OpsTaskStatus;
  dueDate: Date | null;
}

interface OpsTask extends OpsTaskDefinition {
  status: OpsTaskStatus;
  owner: string;
  note: string;
}

type OpsTaskPersistedState = {
  status: OpsTaskStatus;
  owner?: string;
  note?: string;
};

type OpsTaskStoreValue = OpsTaskPersistedState | OpsTaskStatus;

type OpsTaskStore = Record<string, OpsTaskStoreValue>;

type NormalizedTaskStore = Record<string, OpsTaskPersistedState>;

const getTaskFilterOptions = (
  t: (key: string) => string,
  commonT: (key: string) => string,
): Array<{ value: OpsTaskStatus | "all"; label: string }> => {
  const taskStatusLabels = getTaskStatusLabels(t);
  return [
    { value: "all", label: commonT("buttons.all") },
    ...Object.entries(taskStatusLabels).map(([value, label]) => ({
      value: value as OpsTaskStatus,
      label,
    })),
  ];
};

function isTaskStatus(value: string): value is OpsTaskStatus {
  return ["todo", "in_progress", "blocked", "done"].includes(value);
}

interface OpsEventDetailProps {
  eventId: string;
}

export function OpsEventDetail({ eventId }: OpsEventDetailProps) {
  const { t } = useOpsTranslation();
  const { t: commonT } = useCommonTranslation();

  const {
    data: eventResult,
    isLoading,
    isFetching,
    error,
  } = useQuery<EventOperationResult<EventWithDetails>, Error>({
    queryKey: ["ops", "event", eventId],
    queryFn: () => unwrapServerFnResult(getEvent({ data: { id: eventId } })),
  });

  const event = eventResult?.success ? eventResult.data : null;

  const [taskStateStore, setTaskStateStore, clearTaskStateStore] =
    useLocalStorage<OpsTaskStore>(`ops-task-board-${eventId}`, {} as OpsTaskStore);

  const [taskFilter, setTaskFilter] = useLocalStorage<OpsTaskStatus | "all">(
    `ops-task-filter-${eventId}`,
    "all",
  );

  const taskStatusLabels = useMemo(() => getTaskStatusLabels(t), [t]);
  const taskFilterOptions = useMemo(() => getTaskFilterOptions(t, commonT), [t, commonT]);

  const taskTemplates = useMemo<OpsTaskDefinition[]>(() => {
    if (!event) {
      return [];
    }

    return buildTaskTemplates(event, t);
  }, [event, t]);

  const templateMap = useMemo(() => {
    return new Map(taskTemplates.map((task) => [task.id, task]));
  }, [taskTemplates]);

  const normalizedTaskState = useMemo(() => {
    return normalizeTaskState(taskStateStore, templateMap);
  }, [taskStateStore, templateMap]);

  const tasks = useMemo<OpsTask[]>(() => {
    return taskTemplates.map((task) => {
      const persisted = normalizedTaskState[task.id];

      return {
        ...task,
        status: persisted?.status ?? task.defaultStatus,
        owner: persisted?.owner ?? task.defaultOwner,
        note: persisted?.note ?? "",
      };
    });
  }, [taskTemplates, normalizedTaskState]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === taskFilter);
  }, [tasks, taskFilter]);

  const summary = useMemo(() => summarizeTasks(tasks), [tasks]);

  const updateTaskState = useCallback(
    (taskId: string, update: Partial<OpsTaskPersistedState>) => {
      setTaskStateStore((current) => {
        const normalized = normalizeTaskState(current, templateMap);
        const template = templateMap.get(taskId);

        const base: OpsTaskPersistedState = normalized[taskId] ?? {
          status: template?.defaultStatus ?? "todo",
          owner: template?.defaultOwner,
          note: "",
        };

        const next: OpsTaskStore = {
          ...normalized,
          [taskId]: { ...base, ...update },
        };

        return next;
      });
    },
    [setTaskStateStore, templateMap],
  );

  const handleStatusChange = useCallback(
    (taskId: string, status: OpsTaskStatus) => {
      updateTaskState(taskId, { status });
    },
    [updateTaskState],
  );

  const handleOwnerChange = useCallback(
    (taskId: string, owner: string) => {
      updateTaskState(taskId, { owner });
    },
    [updateTaskState],
  );

  const handleNoteChange = useCallback(
    (taskId: string, note: string) => {
      updateTaskState(taskId, { note });
    },
    [updateTaskState],
  );

  const hasTaskOverrides = useMemo(
    () => Object.keys(normalizedTaskState).length > 0,
    [normalizedTaskState],
  );

  const isFiltered = taskFilter !== "all";

  if (isLoading) {
    return <OpsEventDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{commonT("errors.unable_to_load")}</AlertTitle>
          <AlertDescription>
            {error.message || t("event_detail.error_fetching")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!eventResult?.success || !event) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{t("event_detail_hardcoded.event_not_found")}</AlertTitle>
          <AlertDescription>
            {t("event_detail_hardcoded.event_not_found_description")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const blockedTasks = tasks.filter((task) => task.status === "blocked");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  return (
    <div className="container mx-auto space-y-6 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Link to="/ops" className="hover:text-foreground">
              {t("ui.ops_mission_control")}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{event.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl tracking-tight lg:text-4xl">
              {event.name}
            </h1>
            <Badge variant={event.isPublic ? "secondary" : "outline"}>
              {event.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarIcon className="size-4" />
              {format(new Date(event.startDate), "PPP")} —{" "}
              {format(new Date(event.endDate), "PPP")}
            </span>
            {event.city ? (
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="size-4" />
                {event.city}
                {event.province ? `, ${event.province}` : ""}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Users2Icon className="size-4" />
              {event.registrationCount} registered
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/ops/events/$eventId/manage" params={{ eventId: event.id }}>
              Open legacy playbook
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/events-review" search={{ focus: event.id }}>
              Review submission history
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {t("event_detail_hardcoded.operational_outlook")}
              </CardTitle>
              <CardDescription>
                {t("event_detail_hardcoded.operational_outlook_description")}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {summary.completed} of {summary.total} tasks complete
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="tasks">
              <TabsList>
                <TabsTrigger value="tasks">
                  {t("event_detail_hardcoded.task_board")}
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  {t("event_detail_hardcoded.logistics_timeline")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                    <FilterIcon className="size-4" />
                    {isFiltered
                      ? t("ui.showing_tasks_count", {
                          filtered: filteredTasks.length,
                          total: tasks.length,
                        })
                      : t("event_detail.review_tasks")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={taskFilter}
                      onValueChange={(value) =>
                        setTaskFilter(value as OpsTaskStatus | "all")
                      }
                    >
                      <SelectTrigger
                        className="w-full min-w-40 sm:w-48"
                        aria-label={t("event_detail.filter_aria_label")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taskFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="font-normal">
                      {t("ui.tasks_count", {
                        filtered: filteredTasks.length,
                        total: tasks.length,
                      })}
                    </Badge>
                  </div>
                </div>
                <TaskTable
                  tasks={filteredTasks}
                  onStatusChange={handleStatusChange}
                  onOwnerChange={handleOwnerChange}
                  onNoteChange={handleNoteChange}
                  isFiltered={isFiltered}
                  t={t}
                  commonT={commonT}
                  taskStatusLabels={taskStatusLabels}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => clearTaskStateStore()}
                    disabled={!hasTaskOverrides}
                  >
                    <RefreshCwIcon className="size-4" /> {t("ui.reset_to_suggested_plan")}
                  </Button>
                  {isFetching ? (
                    <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                      <ClockIcon className="size-4" /> {t("ui.refreshing_event_data")}
                    </span>
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="timeline">
                <Timeline event={event} tasks={tasks} t={t} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("event_detail_hardcoded.attention_signals")}</CardTitle>
              <CardDescription>
                {t("event_detail_hardcoded.attention_signals_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedTasks.length === 0 && inProgressTasks.length === 0 ? (
                <Alert>
                  <CheckCircle2Icon className="size-4" />
                  <AlertTitle>
                    {t("event_detail_hardcoded.all_systems_nominal")}
                  </AlertTitle>
                  <AlertDescription>
                    {t("event_detail_hardcoded.all_systems_nominal_description")}
                  </AlertDescription>
                </Alert>
              ) : null}

              {blockedTasks.map((task) => (
                <Alert key={task.id} variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>{task.title}</AlertTitle>
                  <AlertDescription>{task.description}</AlertDescription>
                </Alert>
              ))}

              {inProgressTasks.slice(0, 2).map((task) => (
                <Alert key={task.id}>
                  <SparklesIcon className="size-4" />
                  <AlertTitle>{task.title}</AlertTitle>
                  <AlertDescription>{task.description}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("event_detail_hardcoded.operations_snapshot")}</CardTitle>
              <CardDescription>
                {t("event_detail_hardcoded.operations_snapshot_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4 text-sm">
              <SnapshotRow
                icon={<Users2Icon className="size-4" />}
                label={t("event_detail.capacity_remaining")}
                value={formatCapacity(event, t)}
              />
              <SnapshotRow
                icon={<ClipboardListIcon className="size-4" />}
                label={t("event_detail.registration_status")}
                value={
                  event.isRegistrationOpen
                    ? t("event_detail.accepting_signups")
                    : t("event_detail.closed_gated")
                }
              />
              <SnapshotRow
                icon={<ClockIcon className="size-4" />}
                label={t("event_detail.next_milestone")}
                value={formatNextMilestone(event)}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function TaskTable({
  tasks,
  onStatusChange,
  onOwnerChange,
  onNoteChange,
  isFiltered,
  t,
  commonT,
  taskStatusLabels,
}: {
  tasks: OpsTask[];
  onStatusChange: (taskId: string, status: OpsTaskStatus) => void;
  onOwnerChange: (taskId: string, owner: string) => void;
  onNoteChange: (taskId: string, note: string) => void;
  isFiltered: boolean;
  t: (key: string) => string;
  commonT: (key: string) => string;
  taskStatusLabels: Record<string, string>;
}) {
  if (tasks.length === 0) {
    return (
      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertTitle>{commonT("status.no_tasks_available")}</AlertTitle>
        <AlertDescription>
          {isFiltered
            ? t("event_detail.no_tasks_filter")
            : t("event_detail.generate_checklist")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[28%]">{commonT("labels.task")}</TableHead>
            <TableHead className="w-[16%]">{commonT("labels.status")}</TableHead>
            <TableHead className="w-[16%]">{commonT("labels.owner")}</TableHead>
            <TableHead className="w-[18%]">{commonT("labels.due")}</TableHead>
            <TableHead className="w-[12%]">{commonT("labels.focus")}</TableHead>
            <TableHead className="w-[10%]">{commonT("labels.notes")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="align-top">
              <TableCell>
                <div className="space-y-1">
                  <p className="text-foreground font-medium">{task.title}</p>
                  <p className="text-muted-foreground text-xs">{task.description}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={TASK_STATUS_BADGE[task.status]}>
                  {taskStatusLabels[task.status]}
                </Badge>
                <Select
                  value={task.status}
                  onValueChange={(value) =>
                    onStatusChange(task.id, value as OpsTaskStatus)
                  }
                >
                  <SelectTrigger
                    className="mt-2 w-full"
                    aria-label={`Set status for ${task.title}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={task.owner}
                  onValueChange={(value) => onOwnerChange(task.id, value)}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={`Assign owner for ${task.title}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {task.ownerOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <div className="space-y-1 text-xs">
                    <p>{format(task.dueDate, "PPP")}</p>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Schedule with organizer
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    {t(`event_detail_hardcoded.task_categories.${task.category}`)}
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    Default owner: {task.defaultOwner}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <TaskNoteEditor
                  taskId={task.id}
                  taskTitle={task.title}
                  note={task.note}
                  onUpdate={(value) => onNoteChange(task.id, value)}
                  t={t}
                  commonT={commonT}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskNoteEditor({
  taskId,
  taskTitle,
  note,
  onUpdate,
  t,
  commonT,
}: {
  taskId: string;
  taskTitle: string;
  note: string;
  onUpdate: (value: string) => void;
  t: (key: string) => string;
  commonT: (key: string) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const preview = note.trim();
  const buttonLabel = preview.length > 0 ? preview : commonT("actions.add_note");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={preview.length > 0 ? "secondary" : "outline"}
          className="w-full justify-start gap-2 text-left"
          aria-label={
            preview.length > 0
              ? `Edit note for ${taskTitle}`
              : `Add note for ${taskTitle}`
          }
        >
          <StickyNoteIcon className="text-muted-foreground size-4" />
          <span className="line-clamp-2 text-xs font-medium">{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="space-y-3" align="start">
        <div className="space-y-2">
          <Label htmlFor={`task-note-${taskId}`}>{commonT("labels.notes")}</Label>
          <Textarea
            id={`task-note-${taskId}`}
            value={note}
            placeholder={t("event_detail.update_placeholder")}
            onChange={(event) => onUpdate(event.target.value)}
            rows={4}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onUpdate("")}
            disabled={note.length === 0}
          >
            {t("ui.clear_note")}
          </Button>
          <Button type="button" onClick={() => setIsOpen(false)}>
            {t("ui.done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Timeline({
  event,
  tasks,
  t,
}: {
  event: EventWithDetails;
  tasks: OpsTask[];
  t: (key: string) => string;
}) {
  const timeline = buildTimeline(event, tasks, t);

  return (
    <ol className="space-y-4">
      {timeline.map((milestone) => (
        <li
          key={milestone.id}
          className={cn(
            "rounded-lg border p-4",
            milestone.isPast
              ? "bg-muted text-muted-foreground"
              : milestone.isNext
                ? "border-primary/70 bg-primary/5"
                : "bg-card",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              <p className="text-foreground font-medium">{milestone.label}</p>
            </div>
            <span className="text-muted-foreground text-xs">
              {format(milestone.date, "PPP")} ·{" "}
              {formatDistanceToNow(milestone.date, { addSuffix: true })}
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">{milestone.description}</p>
        </li>
      ))}
    </ol>
  );
}

function SnapshotRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{value}</p>
      </div>
    </div>
  );
}

function OpsEventDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Skeleton className="h-[520px] w-full" />
        <div className="space-y-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

function normalizeTaskState(
  store: OpsTaskStore,
  templateMap: Map<string, OpsTaskDefinition>,
): NormalizedTaskStore {
  const normalized: NormalizedTaskStore = {};

  for (const [taskId, value] of Object.entries(store)) {
    const template = templateMap.get(taskId);
    if (!template) {
      continue;
    }

    if (typeof value === "string") {
      const status = isTaskStatus(value) ? value : template.defaultStatus;
      normalized[taskId] = { status };
      continue;
    }

    if (value && typeof value === "object") {
      const status = isTaskStatus(value.status) ? value.status : template.defaultStatus;
      normalized[taskId] = {
        status,
        owner: value.owner ?? template.defaultOwner,
        note: value.note ?? "",
      };
    }
  }

  return normalized;
}

function buildTaskTemplates(
  event: EventWithDetails,
  t: (key: string) => string,
): OpsTaskDefinition[] {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const registrationOpens = event.registrationOpensAt
    ? new Date(event.registrationOpensAt)
    : null;

  const marketingKickoffDue = registrationOpens ?? subDays(start, 35);
  const staffingDue = subDays(start, 21);
  const vendorConfirmDue = subDays(start, 14);
  const onSiteBriefing = subDays(start, 2);
  const postEventDebrief = addDays(end, 2);

  const capacityLow =
    typeof event.availableSpots === "number" &&
    event.availableSpots <= opsCapacityThreshold;

  return [
    {
      id: "ops-approval",
      title: t("event_detail.final_approval"),
      description: t("event_detail.final_approval_description"),
      defaultOwner:
        event.organizer?.name ?? t("event_detail_hardcoded.owner_roles.operations"),
      ownerOptions: buildOwnerOptions(event, [event.organizer?.name ?? "", "Operations"]),
      category: "launch_readiness",
      defaultStatus: event.isPublic ? "done" : "todo",
      dueDate: marketingKickoffDue,
    },
    {
      id: "ops-marketing",
      title: t("task_templates.marketing_kickoff"),
      description: t("task_templates.marketing_kickoff_description"),
      defaultOwner: "Marketing Ops",
      ownerOptions: buildOwnerOptions(event, ["Marketing Ops", "Operations"]),
      category: "marketing",
      defaultStatus: event.isPublic ? "in_progress" : "todo",
      dueDate: marketingKickoffDue,
    },
    {
      id: "ops-registration-health",
      title: t("task_templates.monitor_registration_health"),
      description: t("task_templates.monitor_registration_health_description"),
      defaultOwner: t("event_detail_hardcoded.owner_roles.operations"),
      ownerOptions: buildOwnerOptions(event, ["Operations", event.organizer?.name ?? ""]),
      category: "launch_readiness",
      defaultStatus: capacityLow
        ? "blocked"
        : event.isRegistrationOpen
          ? "in_progress"
          : "todo",
      dueDate: start,
    },
    {
      id: "ops-staffing",
      title: t("task_templates.lock_staffing"),
      description: t("task_templates.lock_staffing_description"),
      defaultOwner: "Field Ops",
      ownerOptions: buildOwnerOptions(event, [
        "Field Ops",
        "Operations",
        "Volunteer Lead",
      ]),
      category: "staffing",
      defaultStatus:
        differenceInDaysToNow(staffingDue) < 0 &&
        !((event.metadata as Record<string, unknown>)?.["opsStaffingLocked"] === true)
          ? "blocked"
          : "in_progress",
      dueDate: staffingDue,
    },
    {
      id: "ops-vendor",
      title: t("task_templates.confirm_vendor_logistics"),
      description: t("task_templates.confirm_vendor_logistics_description"),
      defaultOwner: "Vendor Relations",
      ownerOptions: buildOwnerOptions(event, ["Vendor Relations", "Operations"]),
      category: "logistics",
      defaultStatus: differenceInDaysToNow(vendorConfirmDue) < 0 ? "in_progress" : "todo",
      dueDate: vendorConfirmDue,
    },
    {
      id: "ops-onsite-brief",
      title: t("task_templates.run_show_brief"),
      description: t("task_templates.run_show_brief_description"),
      defaultOwner: t("event_detail_hardcoded.owner_roles.operations"),
      ownerOptions: buildOwnerOptions(event, ["Operations", "Field Ops"]),
      category: "logistics",
      defaultStatus: differenceInDaysToNow(onSiteBriefing) < 0 ? "in_progress" : "todo",
      dueDate: onSiteBriefing,
    },
    {
      id: "ops-post-event",
      title: t("task_templates.post_event_debrief"),
      description: t("task_templates.post_event_debrief_description"),
      defaultOwner: "Insights",
      ownerOptions: buildOwnerOptions(event, ["Insights", "Operations"]),
      category: "post_event",
      defaultStatus: isAfter(new Date(), end) ? "in_progress" : "todo",
      dueDate: postEventDebrief,
    },
  ];
}

function buildOwnerOptions(
  event: EventWithDetails,
  priority: Array<string | undefined> = [],
): string[] {
  const base = [
    "Operations",
    event.organizer?.name ?? "",
    "Marketing Ops",
    "Field Ops",
    "Vendor Relations",
    "Insights",
    "Volunteer Lead",
    "Finance Ops",
    "Partnerships",
  ];

  const unique = new Set<string>();
  for (const entry of [...priority, ...base]) {
    if (!entry) {
      continue;
    }

    const trimmed = entry.trim();
    if (trimmed.length === 0) {
      continue;
    }

    unique.add(trimmed);
  }

  return Array.from(unique);
}

function summarizeTasks(tasks: OpsTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  return { total, completed };
}

function buildTimeline(
  event: EventWithDetails,
  tasks: OpsTask[],
  t: (key: string) => string,
) {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const milestones = [
    {
      id: "timeline-marketing",
      date:
        tasks.find((task) => task.id === "ops-marketing")?.dueDate ?? subDays(start, 35),
      label: t("timeline.marketing_launch"),
      description: t("timeline.marketing_launch_description"),
    },
    {
      id: "timeline-staffing",
      date:
        tasks.find((task) => task.id === "ops-staffing")?.dueDate ?? subDays(start, 21),
      label: t("timeline.staffing_locked"),
      description: t("timeline.staffing_locked_description"),
    },
    {
      id: "timeline-onsite",
      date:
        tasks.find((task) => task.id === "ops-onsite-brief")?.dueDate ??
        subDays(start, 2),
      label: t("timeline.onsite_briefing"),
      description: t("timeline.onsite_briefing_description"),
    },
    {
      id: "timeline-event",
      date: start,
      label: t("timeline.event_day"),
      description: t("timeline.event_day_description"),
    },
    {
      id: "timeline-debrief",
      date: addDays(end, 2),
      label: t("timeline.post_event_debrief"),
      description: t("timeline.post_event_debrief_description"),
    },
  ];

  const nextMilestone = milestones
    .filter((milestone) => milestone.date && isAfter(milestone.date, now))
    .sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0))[0]?.id;

  return milestones.map((milestone) => ({
    ...milestone,
    isPast: milestone.date ? isBefore(milestone.date, now) : false,
    isNext: milestone.id === nextMilestone,
  }));
}

function formatCapacity(
  event: EventWithDetails,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (typeof event.availableSpots === "number") {
    if (event.availableSpots <= 0) {
      return t("capacity.waitlist_only");
    }

    return t("capacity.spots_remaining", { count: event.availableSpots });
  }

  if (event.registrationType === "team") {
    return t("capacity.team_cap_not_set");
  }

  if (event.registrationType === "individual") {
    return t("capacity.participant_cap_not_set");
  }

  return t("capacity.capacity_tbd");
}

function formatNextMilestone(event: EventWithDetails): string {
  const start = new Date(event.startDate);
  const now = new Date();

  if (isAfter(now, start)) {
    return "Event in progress or complete";
  }

  const daysUntil = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) {
    return "Event starts today";
  }

  return `${daysUntil} day${daysUntil === 1 ? "" : "s"} until doors open`;
}

function differenceInDaysToNow(target: Date) {
  const now = new Date();
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
