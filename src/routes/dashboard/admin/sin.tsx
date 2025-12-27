import { createFileRoute, Outlet, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { getSinAdminNav } from "~/features/layouts/sin-admin-nav";
import { filterNavItems, requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin");
  },
  component: SinAdminLayout,
});

function SinAdminLayout() {
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;

  const navItems = useMemo(() => filterNavItems(getSinAdminNav(), { user }), [user]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">SIN Admin</h2>
        <p className="text-muted-foreground text-sm">
          Configure organizations, reporting, and compliance workflows.
        </p>
      </div>

      {navItems.length > 0 ? (
        <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              {...(item.exact ? { activeOptions: { exact: true as const } } : {})}
              activeProps={{
                className:
                  "rounded-md bg-admin-secondary px-3 py-1.5 text-sm font-semibold text-admin-primary",
                "aria-current": "page",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <Outlet />
    </div>
  );
}
