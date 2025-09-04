import { useRouteContext } from "@tanstack/react-router";
import { BarChart3, Calendar, Home, Settings, User, Users } from "lucide-react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { userHasRole } from "~/features/roles/permission.service";
import { cn } from "~/shared/lib/utils";

interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  requiresRole?: boolean;
  roles?: string[];
}

export function MobileTabBar() {
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;

  const baseItems: TabItem[] = [
    { key: "dashboard", label: "Home", icon: Home, to: "/dashboard" },
    { key: "events", label: "Events", icon: Calendar, to: "/dashboard/events" },
    { key: "members", label: "Members", icon: Users, to: "/dashboard/members" },
    { key: "profile", label: "Profile", icon: User, to: "/dashboard/profile" },
  ];

  const maybeReports: TabItem = {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    to: "/dashboard/reports",
    requiresRole: true,
    roles: ["Platform Admin", "Games Admin"],
  };

  const items: TabItem[] = [
    ...baseItems,
    // Conditionally include Reports if permitted
    ...(user && maybeReports.roles?.some((r) => userHasRole(user, r))
      ? [maybeReports]
      : []),
    // Always include Settings as a final tab
    { key: "settings", label: "Settings", icon: Settings, to: "/dashboard/settings" },
  ];

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-between">
        {items.map(({ key, label, icon: Icon, to }) => (
          <li key={key} className="flex-1">
            <Link
              to={to}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-xs text-gray-600",
                "data-[status=active]:text-primary",
              )}
              activeProps={{
                className: "text-primary",
                "aria-current": "page",
                "data-status": "active",
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
