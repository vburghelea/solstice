import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  updateNotificationTemplate,
} from "../notifications.mutations";
import { listNotificationTemplates } from "../notifications.queries";

const categories = [
  { value: "reporting", label: "Reporting" },
  { value: "security", label: "Security" },
  { value: "support", label: "Support" },
  { value: "system", label: "System" },
];

type TemplateDraft = {
  key: string;
  category: string;
  subject: string;
  bodyTemplate: string;
  isSystem: boolean;
};

const defaultDraft: TemplateDraft = {
  key: "",
  category: "system",
  subject: "",
  bodyTemplate: "",
  isSystem: false,
};

export function NotificationTemplatePanel() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, TemplateDraft>>({});
  const [newTemplate, setNewTemplate] = useState<TemplateDraft>(defaultDraft);

  const { data: templates = [] } = useQuery({
    queryKey: ["notifications", "templates"],
    queryFn: () => listNotificationTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createNotificationTemplate({
        data: {
          key: newTemplate.key,
          category: newTemplate.category as TemplateDraft["category"],
          subject: newTemplate.subject,
          bodyTemplate: newTemplate.bodyTemplate,
          isSystem: newTemplate.isSystem,
        },
      }),
    onSuccess: () => {
      setNewTemplate(defaultDraft);
      void queryClient.invalidateQueries({ queryKey: ["notifications", "templates"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { templateId: string; data: TemplateDraft }) =>
      updateNotificationTemplate({
        data: {
          templateId: payload.templateId,
          data: {
            key: payload.data.key,
            category: payload.data.category as TemplateDraft["category"],
            subject: payload.data.subject,
            bodyTemplate: payload.data.bodyTemplate,
            isSystem: payload.data.isSystem,
          },
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", "templates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      deleteNotificationTemplate({ data: { templateId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", "templates"] });
    },
  });

  const draftFor = (id: string): TemplateDraft =>
    drafts[id] ?? {
      key: "",
      category: "system",
      subject: "",
      bodyTemplate: "",
      isSystem: false,
    };

  const setDraft = (id: string, next: Partial<TemplateDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...draftFor(id), ...next },
    }));
  };

  const readyToCreate = useMemo(() => {
    return (
      newTemplate.key.trim().length > 0 &&
      newTemplate.subject.trim().length > 0 &&
      newTemplate.bodyTemplate.trim().length > 0
    );
  }, [newTemplate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <p className="text-sm font-semibold">Create template</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Template key (e.g. reporting_reminder)"
              value={newTemplate.key}
              onChange={(event) =>
                setNewTemplate((prev) => ({ ...prev, key: event.target.value }))
              }
            />
            <Select
              value={newTemplate.category}
              onValueChange={(value) =>
                setNewTemplate((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Subject"
            value={newTemplate.subject}
            onChange={(event) =>
              setNewTemplate((prev) => ({ ...prev, subject: event.target.value }))
            }
          />
          <Textarea
            rows={3}
            placeholder="Body template (supports {{variables}})"
            value={newTemplate.bodyTemplate}
            onChange={(event) =>
              setNewTemplate((prev) => ({ ...prev, bodyTemplate: event.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={newTemplate.isSystem}
              onCheckedChange={(checked) =>
                setNewTemplate((prev) => ({ ...prev, isSystem: Boolean(checked) }))
              }
            />
            System template (locked)
          </label>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!readyToCreate || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create template"}
          </Button>
        </div>

        {templates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No templates yet.</p>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => {
              const draft = draftFor(template.id);
              const isEditing = Boolean(drafts[template.id]);
              return (
                <div
                  key={template.id}
                  className="space-y-3 rounded-md border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{template.key}</p>
                      <p className="text-muted-foreground text-xs">
                        {template.category} · {template.isSystem ? "system" : "custom"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [template.id]: {
                              key: template.key,
                              category: template.category,
                              subject: template.subject,
                              bodyTemplate: template.bodyTemplate,
                              isSystem: template.isSystem,
                            },
                          }))
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={template.isSystem || deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Template key"
                          value={draft.key}
                          onChange={(event) =>
                            setDraft(template.id, { key: event.target.value })
                          }
                        />
                        <Select
                          value={draft.category}
                          onValueChange={(value) =>
                            setDraft(template.id, { category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Subject"
                        value={draft.subject}
                        onChange={(event) =>
                          setDraft(template.id, { subject: event.target.value })
                        }
                      />
                      <Textarea
                        rows={3}
                        placeholder="Body template"
                        value={draft.bodyTemplate}
                        onChange={(event) =>
                          setDraft(template.id, { bodyTemplate: event.target.value })
                        }
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={draft.isSystem}
                            onCheckedChange={(checked) =>
                              setDraft(template.id, { isSystem: Boolean(checked) })
                            }
                          />
                          System template
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              templateId: template.id,
                              data: draft,
                            })
                          }
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDrafts((prev) => {
                              const next = { ...prev };
                              delete next[template.id];
                              return next;
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      <p>Subject: {template.subject}</p>
                      <p>Body: {template.bodyTemplate}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
