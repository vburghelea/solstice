import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
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
import { Textarea } from "~/components/ui/textarea";
import {
  createTemplate,
  createTemplateUpload,
  deleteTemplate,
} from "../templates.mutations";
import { listTemplates } from "../templates.queries";
import type { TemplateContext } from "../templates.schemas";

const contextOptions: Array<{ value: TemplateContext; label: string }> = [
  { value: "forms", label: "Forms" },
  { value: "imports", label: "Imports" },
  { value: "reporting", label: "Reporting" },
  { value: "analytics", label: "Analytics" },
  { value: "general", label: "General" },
];

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export function TemplateAdminPanel() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [context, setContext] = useState<TemplateContext>("general");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", "admin"],
    queryFn: () => listTemplates({ data: { includeArchived: true } }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Select a template file to upload.");
      }

      const upload = await createTemplateUpload({
        data: {
          organizationId: organizationId.trim() || undefined,
          context,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        },
      });

      if (!upload?.uploadUrl || !upload.storageKey) {
        throw new Error("Failed to request upload URL.");
      }

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!response.ok) {
        throw new Error("Template upload failed.");
      }

      return createTemplate({
        data: {
          organizationId: organizationId.trim() || undefined,
          name,
          description: description.trim() || undefined,
          context,
          tags: parseTags(tags),
          storageKey: upload.storageKey,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        },
      });
    },
    onSuccess: () => {
      toast.success("Template saved.");
      setName("");
      setDescription("");
      setTags("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save template.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate({ data: { templateId } }),
    onSuccess: () => {
      toast.success("Template archived.");
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to archive template.");
    },
  });

  const grouped = useMemo(() => {
    const active = templates.filter((template) => !template.isArchived);
    const archived = templates.filter((template) => template.isArchived);
    return { active, archived };
  }, [templates]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload a template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Reporting upload template"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-org">Organization ID (optional)</Label>
              <Input
                id="template-org"
                placeholder="Leave blank for global"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              rows={3}
              placeholder="What is this template for?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Context</Label>
              <Select
                value={context}
                onValueChange={(value) => setContext(value as TemplateContext)}
              >
                <SelectTrigger>
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-tags">Tags</Label>
              <Input
                id="template-tags"
                placeholder="comma-separated tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-file">Template file</Label>
            <Input
              id="template-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            onClick={() => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              void createMutation.mutateAsync();
            }}
            disabled={!name.trim() || !file || isSubmitting}
          >
            {isSubmitting ? "Uploading…" : "Save template"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Active templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-muted-foreground text-sm">Loading templates…</div>
            ) : grouped.active.length === 0 ? (
              <div className="text-muted-foreground text-sm">No active templates.</div>
            ) : (
              grouped.active.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {template.context} • {template.fileName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.organizationId ? (
                      <Badge variant="outline">Org scoped</Badge>
                    ) : (
                      <Badge variant="secondary">Global</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveMutation.mutate(template.id)}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archived templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped.archived.length === 0 ? (
              <div className="text-muted-foreground text-sm">No archived templates.</div>
            ) : (
              grouped.archived.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {template.context} • {template.fileName}
                    </p>
                  </div>
                  <Badge variant="outline">Archived</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
