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
import { getTemplateDownloadUrl, getTemplatePreviewUrl } from "../templates.mutations";
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

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

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

  const groupedTemplates = useMemo(() => {
    const groups = new Map<string, typeof templates>();

    for (const template of templates) {
      const key = `${template.organizationId ?? "global"}:${template.context}:${template.name}`;
      const group = groups.get(key);
      if (group) {
        group.push(template);
      } else {
        groups.set(key, [template]);
      }
    }

    const entries = Array.from(groups.entries()).map(([key, items]) => {
      const sorted = [...items].sort((a, b) => {
        const aDate = a.updatedAt ?? a.createdAt;
        const bDate = b.updatedAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      const [latest, ...history] = sorted;
      return {
        key,
        latest,
        history,
        versionCount: sorted.length,
      };
    });

    return entries.sort((a, b) => {
      const aDate = a.latest.updatedAt ?? a.latest.createdAt;
      const bDate = b.latest.updatedAt ?? b.latest.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [templates]);

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

  const previewMutation = useMutation({
    mutationFn: (templateId: string) => getTemplatePreviewUrl({ data: { templateId } }),
    onSuccess: (result) => {
      if (!result?.previewUrl) {
        toast.error("Template preview failed.");
        return;
      }
      window.open(result.previewUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Template preview failed.");
    },
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
      ) : groupedTemplates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No templates available.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupedTemplates.map((group) => {
            const { latest, history, versionCount } = group;
            const isExpanded = expandedGroups.has(group.key);

            return (
              <Card key={group.key}>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base">{latest.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {latest.context}
                    </Badge>
                    {latest.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="capitalize">
                        {tag}
                      </Badge>
                    ))}
                    {versionCount > 1 ? (
                      <Badge variant="outline">{versionCount} versions</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {latest.description || "No description provided."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
                    <span>
                      {latest.fileName} • {formatBytes(latest.sizeBytes ?? 0)}
                    </span>
                    <span>
                      Updated {formatDate(latest.updatedAt ?? latest.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => previewMutation.mutate(latest.id)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadMutation.mutate(latest.id)}
                    >
                      Download
                    </Button>
                    {versionCount > 1 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleGroup(group.key)}
                      >
                        {isExpanded
                          ? "Hide versions"
                          : `View ${versionCount - 1} older versions`}
                      </Button>
                    ) : null}
                  </div>
                  {versionCount > 1 && isExpanded ? (
                    <div className="space-y-2 border-t pt-2">
                      {history.map((version, index) => {
                        const versionLabel = `Version ${versionCount - index - 1}`;
                        return (
                          <div
                            key={version.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                          >
                            <div>
                              <p className="text-xs font-medium">{versionLabel}</p>
                              <p className="text-muted-foreground text-xs">
                                {version.fileName} • {formatBytes(version.sizeBytes ?? 0)}{" "}
                                • Updated{" "}
                                {formatDate(version.updatedAt ?? version.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => previewMutation.mutate(version.id)}
                              >
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadMutation.mutate(version.id)}
                              >
                                Download
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
