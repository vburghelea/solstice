import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { FileUp, FolderOpen, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SmartImportWizard } from "~/features/imports/components/smart-import-wizard";
import { ImportTemplatesPanel } from "~/features/imports/components/import-templates-panel";
import { ImportJobsPanel } from "~/features/imports/components/import-jobs-panel";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

const searchSchema = z.object({
  tab: z.enum(["wizard", "templates", "history"]).optional().default("wizard"),
});

export const Route = createFileRoute("/dashboard/admin/sin/imports")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_imports");
  },
  head: () => createPageHead("Import Administration"),
  component: SinImportsAdminPage,
});

function SinImportsAdminPage() {
  const { tab } = useSearch({ from: "/dashboard/admin/sin/imports" });
  const navigate = Route.useNavigate();

  const handleTabChange = (value: string) => {
    navigate({
      search: { tab: value as "wizard" | "templates" | "history" },
    });
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Import Administration</h1>
        <p className="text-muted-foreground">
          Manage data imports, templates, and view import history
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="wizard" className="gap-2">
            <FileUp className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-6">
          <SmartImportWizard />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ImportTemplatesPanel />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ImportJobsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
