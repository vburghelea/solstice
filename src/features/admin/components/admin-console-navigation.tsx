import { Link, useRouterState } from "@tanstack/react-router";
import { FlagIcon, LineChartIcon, UsersIcon } from "lucide-react";

import { cn } from "~/shared/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  description: string;
  icon: typeof LineChartIcon;
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    to: "/admin/insights",
    label: "Insights",
    description: "System KPIs, incidents, and alerting",
    icon: LineChartIcon,
  },
  {
    to: "/admin/users",
    label: "Users",
    description: "Roles, membership, and MFA coverage",
    icon: UsersIcon,
  },
  {
    to: "/admin/feature-flags",
    label: "Feature flags",
    description: "Persona rollouts and experiments",
    icon: FlagIcon,
  },
];

export function AdminConsoleNavigation() {
  const location = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="token-gap-sm grid gap-3 md:grid-cols-3" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "hover:border-primary/50 hover:bg-primary/5 rounded-xl border p-4 text-left transition",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-elevated",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-5" aria-hidden />
              <span className="text-body-sm font-semibold">{item.label}</span>
            </div>
            <p className="text-body-xs text-muted-foreground">{item.description}</p>
          </Link>
        );
      })}
    </nav>
  );
}
