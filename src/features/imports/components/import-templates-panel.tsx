import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Download, FileText, Search, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { getLatestFormVersion } from "~/features/forms/forms.queries";
import { listImportTemplates } from "../imports.queries";
import { deleteImportTemplate, downloadImportTemplate } from "../imports.mutations";

interface ImportTemplatesPanelProps {
  organizationId?: string;
}

export function ImportTemplatesPanel({ organizationId }: ImportTemplatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"xlsx" | "csv">("xlsx");

  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["import-templates", organizationId],
    queryFn: () => listImportTemplates({ data: { organizationId } }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteImportTemplate({ data: { templateId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-templates"] });
      setDeleteDialogOpen(false);
      setSelectedTemplateId(null);
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: async ({
      templateId,
      format,
    }: {
      templateId: string;
      format: "xlsx" | "csv";
    }) => {
      const result = await downloadImportTemplate({
        data: { templateId, format },
      });
      return result;
    },
    onSuccess: (data) => {
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    },
  });

  const templates = templatesQuery.data ?? [];
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplateId) {
      deleteTemplateMutation.mutate(selectedTemplateId);
    }
  };

  const handleDownload = (templateId: string) => {
    downloadTemplateMutation.mutate({ templateId, format: downloadFormat });
  };

  const formIds = Array.from(new Set(templates.map((template) => template.formId)));
  const latestVersionQueries = useQueries({
    queries: formIds.map((formId) => ({
      queryKey: ["forms", "latest", formId],
      queryFn: () => getLatestFormVersion({ data: { formId } }),
      enabled: Boolean(formId),
    })),
  });

  const latestVersionMap = new Map(
    formIds.map((formId, index) => [formId, latestVersionQueries[index]?.data?.id]),
  );

  if (templatesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={downloadFormat}
            onValueChange={(value: "xlsx" | "csv") => setDownloadFormat(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">XLSX</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "Templates will appear here when created from forms"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            // Parse columns to show field count
            const fieldCount = Array.isArray(template.columns)
              ? template.columns.length
              : typeof template.columns === "object" && template.columns !== null
                ? Object.keys(template.columns).length
                : 0;

            const latestVersionId = latestVersionMap.get(template.formId);
            const hasVersionWarning =
              Boolean(latestVersionId) && template.formVersionId !== latestVersionId;

            return (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    {hasVersionWarning && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="shrink-0 gap-1 text-amber-600"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Version
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Form schema may have changed since this template was created
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{fieldCount} fields</Badge>
                    <span>
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleDownload(template.id)}
                      disabled={downloadTemplateMutation.isPending}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
