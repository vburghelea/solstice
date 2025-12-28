import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useOrgContext } from "~/features/organizations/org-context";
import { getTemplateDownloadUrl } from "../templates.mutations";
import { listTemplates } from "../templates.queries";
import type { TemplateContext } from "../templates.schemas";

const contextOptions: Array<{ value: TemplateContext | "all"; label: string }> = [
  { value: "all", label: "All contexts" },
  { value: "forms", label: "Forms" },
  { value: "imports", label: "Imports" },
  { value: "reporting", label: "Reporting" },
  { value: "analytics", label: "Analytics" },
  { value: "general", label: "General" },
];

const formatBytes = (size: number) => {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

export function TemplateHub({
  initialContext,
}: {
  initialContext?: TemplateContext | null;
}) {
  const { activeOrganizationId } = useOrgContext();
  const [search, setSearch] = useState("");
  const [context, setContext] = useState<TemplateContext | "all">(
    initialContext ?? "all",
  );

  const filters = useMemo(
    () => ({
      organizationId: activeOrganizationId ?? undefined,
      context: context === "all" ? undefined : context,
      search: search.trim() ? search.trim() : undefined,
    }),
    [activeOrganizationId, context, search],
  );

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", filters],
    queryFn: () => listTemplates({ data: filters }),
    enabled: Boolean(activeOrganizationId),
  });

  const downloadMutation = useMutation({
    mutationFn: (templateId: string) => getTemplateDownloadUrl({ data: { templateId } }),
    onSuccess: (result) => {
      if (!result?.downloadUrl) {
        toast.error("Template download failed.");
        return;
      }
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Template download failed.");
    },
  });

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to view templates.</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard/select-org">Choose organization</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Download the latest templates for reporting, imports, and analytics.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search templates"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-56"
          />
          <Select
            value={context}
            onValueChange={(value) => setContext(value as TemplateContext | "all")}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Context" />
            </SelectTrigger>
            <SelectContent>
              {contextOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading templates…</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No templates available.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {template.context}
                  </Badge>
                  {template.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  {template.description || "No description provided."}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">
                  {template.fileName} • {formatBytes(template.sizeBytes ?? 0)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadMutation.mutate(template.id)}
                >
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
