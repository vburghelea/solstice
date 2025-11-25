import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  DEFAULT_SYSTEM_EDITOR_TAB,
  SystemEditor,
  type AdminSystemEditorTab,
} from "~/features/game-systems/admin/components/system-editor";
import { getAdminGameSystem } from "~/features/game-systems/admin/game-systems-admin.queries";
import type { AdminGameSystemDetail } from "~/features/game-systems/admin/game-systems-admin.types";
import {
  systemEditorParamsSchema,
  systemEditorSearchSchema,
  type SystemEditorSearchParams,
} from "~/features/game-systems/admin/views/system-editor-route-schemas";
import { requireRole } from "~/lib/auth/middleware/role-guard";

type LoaderData = { system: AdminGameSystemDetail };

export const Route = createFileRoute("/admin/systems/$systemId")({
  validateSearch: systemEditorSearchSchema.parse,
  beforeLoad: async ({ context, location }) => {
    await requireRole({
      user: context.user,
      requiredRoles: ["Platform Admin", "Roundup Games Admin", "Super Admin"],
      redirectTo: "/admin",
      language: context.language,
      currentPath: location.pathname,
    });
  },
  loader: async ({ params }) => {
    const parsedParams = systemEditorParamsSchema.parse(params);
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
  const search = Route.useSearch() as SystemEditorSearchParams;
  const navigate = Route.useNavigate();
  const [systemState, setSystemState] = useState(system);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setSystemState(system);
  }, [system]);

  const activeTab = (search.tab ?? DEFAULT_SYSTEM_EDITOR_TAB) as AdminSystemEditorTab;

  const handleTabChange = (nextTab: AdminSystemEditorTab) => {
    navigate({
      search: (prev: SystemEditorSearchParams) => {
        const next: SystemEditorSearchParams = { ...prev, tab: nextTab };
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
