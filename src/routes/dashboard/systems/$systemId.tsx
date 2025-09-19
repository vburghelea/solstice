import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  DEFAULT_SYSTEM_EDITOR_TAB,
  SystemEditor,
  type AdminSystemEditorTab,
} from "~/features/game-systems/admin/components/system-editor";
import { getAdminGameSystem } from "~/features/game-systems/admin/game-systems-admin.queries";
import type { AdminGameSystemDetail } from "~/features/game-systems/admin/game-systems-admin.types";

const tabEnumValues = ["overview", "content", "media", "taxonomy", "crawl"] as const;
const searchSchema = z.object({
  tab: z.enum(tabEnumValues).optional(),
});

const paramsSchema = z.object({
  systemId: z.string(),
});

type AdminSystemEditorSearch = z.infer<typeof searchSchema>;

type LoaderData = { system: AdminGameSystemDetail };

export const Route = createFileRoute("/dashboard/systems/$systemId")({
  validateSearch: searchSchema.parse,
  loader: async ({ params }) => {
    const parsedParams = paramsSchema.parse(params);
    const systemId = Number.parseInt(parsedParams.systemId, 10);
    if (!Number.isFinite(systemId)) {
      throw notFound();
    }

    const system = await getAdminGameSystem({ data: { systemId } });
    if (!system) {
      throw notFound();
    }

    return { system } satisfies LoaderData;
  },
  component: AdminSystemEditorRoute,
});

function AdminSystemEditorRoute() {
  const { system } = Route.useLoaderData() as LoaderData;
  const search = Route.useSearch() as AdminSystemEditorSearch;
  const navigate = Route.useNavigate();
  const [systemState, setSystemState] = useState(system);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setSystemState(system);
  }, [system]);

  const activeTab = (search.tab ?? DEFAULT_SYSTEM_EDITOR_TAB) as AdminSystemEditorTab;

  const handleTabChange = (nextTab: AdminSystemEditorTab) => {
    navigate({
      search: (prev) => {
        const next: AdminSystemEditorSearch = { ...prev, tab: nextTab };
        if (nextTab === DEFAULT_SYSTEM_EDITOR_TAB) {
          next.tab = undefined;
        }
        return next;
      },
      replace: true,
    });
  };

  return (
    <SystemEditor
      system={systemState}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSystemChange={setSystemState}
    />
  );
}
