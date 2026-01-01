import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useCreateDashboard } from "~/features/bi/hooks/use-dashboard";

export const Route = createFileRoute("/dashboard/analytics/dashboards/new")({
  component: NewDashboardPage,
});

function NewDashboardPage() {
  const navigate = useNavigate();
  const createDashboard = useCreateDashboard();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Dashboard name is required.");
      return;
    }

    try {
      const result = await createDashboard.mutateAsync({
        data: { name, description: description || undefined },
      });
      if (result?.dashboardId) {
        navigate({
          to: "/dashboard/analytics/dashboards/$dashboardId",
          params: { dashboardId: result.dashboardId },
        });
      }
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
          <Button onClick={handleCreate} disabled={createDashboard.isPending}>
            Create dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
