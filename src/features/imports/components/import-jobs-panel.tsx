import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
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
import { listImportJobs, listImportJobErrors } from "../imports.queries";
import { rollbackImportJob } from "../imports.mutations";

type JobStatus =
  | "pending"
  | "validating"
  | "validated"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled"
  | "rolled_back"
  | "all";

const STATUS_CONFIG: Record<
  Exclude<JobStatus, "all">,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    variant: "secondary",
  },
  validating: {
    label: "Validating",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    variant: "secondary",
  },
  validated: {
    label: "Validated",
    icon: <Check className="h-3 w-3" />,
    variant: "outline",
  },
  importing: {
    label: "Importing",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    variant: "secondary",
  },
  completed: {
    label: "Completed",
    icon: <Check className="h-3 w-3" />,
    variant: "default",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3 w-3" />,
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-3 w-3" />,
    variant: "outline",
  },
  rolled_back: {
    label: "Rolled Back",
    icon: <RotateCcw className="h-3 w-3" />,
    variant: "outline",
  },
};

interface ImportJobsPanelProps {
  organizationId?: string;
}

function JobStatusBadge({ status }: { status: Exclude<JobStatus, "all"> }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

function JobErrorsCollapsible({ jobId }: { jobId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const errorsQuery = useQuery({
    queryKey: ["import-job-errors", jobId],
    queryFn: () => listImportJobErrors({ data: { jobId } }),
    enabled: isOpen,
  });

  const errors = errorsQuery.data ?? [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          View Errors
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {errorsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading errors...
          </div>
        ) : errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No errors recorded</p>
        ) : (
          <div className="max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-xs">
            {errors.slice(0, 10).map((error, i) => (
              <div
                key={error.id ?? i}
                className="border-b border-muted py-1 last:border-0"
              >
                <span className="font-medium">Row {error.rowNumber}:</span>{" "}
                {error.errorMessage}
              </div>
            ))}
            {errors.length > 10 && (
              <p className="pt-2 text-muted-foreground">
                + {errors.length - 10} more errors
              </p>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ImportJobsPanel({ organizationId }: ImportJobsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus>("all");
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["import-jobs", organizationId],
    queryFn: () => listImportJobs({ data: { organizationId } }),
  });

  const rollbackMutation = useMutation({
    mutationFn: (jobId: string) =>
      rollbackImportJob({ data: { jobId, reason: "User requested rollback" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
      setRollbackDialogOpen(false);
      setSelectedJobId(null);
    },
  });

  const jobs = jobsQuery.data ?? [];
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.sourceFileKey?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRollback = (jobId: string) => {
    setSelectedJobId(jobId);
    setRollbackDialogOpen(true);
  };

  const confirmRollback = () => {
    if (selectedJobId) {
      rollbackMutation.mutate(selectedJobId);
    }
  };

  // Check if a job can be rolled back (within 24 hours and completed)
  const canRollback = (job: (typeof jobs)[0]) => {
    if (job.status !== "completed") return false;
    const completedAt = job.completedAt ? new Date(job.completedAt) : null;
    if (!completedAt) return false;
    const hoursAgo = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
    return hoursAgo <= 24;
  };

  // Format duration
  const formatDuration = (
    startedAt: Date | string | null,
    completedAt: Date | string | null,
  ) => {
    if (!startedAt) return "-";
    const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
    const end = completedAt
      ? completedAt instanceof Date
        ? completedAt
        : new Date(completedAt)
      : new Date();
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (jobsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as JobStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="validating">Validating</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="importing">Importing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rolled_back">Rolled Back</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No import jobs found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Import jobs will appear here after running imports"}
          </p>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const stats =
                  typeof job.stats === "object" && job.stats !== null
                    ? (job.stats as Record<string, number>)
                    : {};
                const totalRows = stats["totalRows"] ?? job.sourceRowCount ?? 0;
                const hasErrors =
                  job.status === "failed" || (stats["errorRows"] ?? 0) > 0;

                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <JobStatusBadge status={job.status as Exclude<JobStatus, "all">} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {job.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {totalRows.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDuration(job.startedAt, job.completedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasErrors && <JobErrorsCollapsible jobId={job.id} />}
                        {canRollback(job) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-amber-600 hover:text-amber-700"
                            onClick={() => handleRollback(job.id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Rollback Import
            </DialogTitle>
            <DialogDescription>
              This will undo all records created by this import. This action cannot be
              reversed. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRollback}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? "Rolling back..." : "Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
