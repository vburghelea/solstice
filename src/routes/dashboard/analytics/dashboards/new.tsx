import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { addWidget } from "~/features/bi/bi.mutations";
import { useCreateDashboard } from "~/features/bi/hooks/use-dashboard";
import { DASHBOARD_TEMPLATES } from "~/features/bi/templates/dashboard-templates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/analytics/dashboards/new")({
  head: () => createPageHead("New Dashboard"),
  component: NewDashboardPage,
});

function NewDashboardPage() {
  const navigate = useNavigate();
  const createDashboard = useCreateDashboard();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("blank");

  const selectedTemplate = useMemo(
    () => DASHBOARD_TEMPLATES.find((template) => template.id === templateId) ?? null,
    [templateId],
  );

  const addWidgetMutation = useMutation({
    mutationFn: addWidget,
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Dashboard name is required.");
      return;
    }

    try {
      const result = await createDashboard.mutateAsync({
        data: { name, description: description || undefined },
      });
      if (!result?.dashboardId) return;

      if (selectedTemplate) {
        for (const widget of selectedTemplate.widgets) {
          await addWidgetMutation.mutateAsync({
            data: {
              dashboardId: result.dashboardId,
              widgetType: widget.widgetType,
              title: widget.title,
              position: widget.position,
              ...(widget.query ? { query: widget.query } : {}),
              ...(widget.config ? { config: widget.config } : {}),
            },
          });
        }
      }

      navigate({
        to: "/dashboard/analytics/dashboards/$dashboardId",
        params: { dashboardId: result.dashboardId },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create dashboard.");
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>New dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank dashboard</SelectItem>
                {DASHBOARD_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate ? (
              <p className="text-muted-foreground text-xs">
                {selectedTemplate.description}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Start from scratch and add widgets later.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={createDashboard.isPending || addWidgetMutation.isPending}
          >
            {addWidgetMutation.isPending ? "Applying template..." : "Create dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
