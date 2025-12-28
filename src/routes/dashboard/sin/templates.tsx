import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TemplateHub } from "~/features/templates/components/template-hub";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

const searchSchema = z.object({
  context: z.enum(["forms", "imports", "reporting", "analytics", "general"]).optional(),
});

export const Route = createFileRoute("/dashboard/sin/templates")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    requireFeatureInRoute("sin_templates");
  },
  component: SinTemplatesPage,
});

function SinTemplatesPage() {
  const search = Route.useSearch();
  return (
    <div className="container mx-auto space-y-6 p-6">
      <TemplateHub initialContext={search.context ?? null} />
    </div>
  );
}
