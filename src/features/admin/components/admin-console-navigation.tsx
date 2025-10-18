import { useRouterState } from "@tanstack/react-router";
import { FlagIcon, LineChartIcon, ShieldAlertIcon, UsersIcon } from "lucide-react";

import { SafeLink as Link } from "~/components/ui/SafeLink";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  description: string;
  icon: typeof LineChartIcon;
}

function useNavItems(): AdminNavItem[] {
  const { t } = useAdminTranslation();
  return [
    {
      to: "/admin/insights",
      label: t("navigation.items.insights.label"),
      description: t("navigation.items.insights.description"),
      icon: LineChartIcon,
    },
    {
      to: "/admin/users",
      label: t("navigation.items.users.label"),
      description: t("navigation.items.users.description"),
      icon: UsersIcon,
    },
    {
      to: "/admin/security",
      label: t("navigation.items.security.label"),
      description: t("navigation.items.security.description"),
      icon: ShieldAlertIcon,
    },
    {
      to: "/admin/feature-flags",
      label: t("navigation.items.feature_flags.label"),
      description: t("navigation.items.feature_flags.description"),
      icon: FlagIcon,
    },
  ];
}

export function AdminConsoleNavigation() {
  const location = useRouterState({ select: (state) => state.location.pathname });
  const { t } = useAdminTranslation();
  const navItems = useNavItems();
  return (
    <nav
      className="token-gap-sm grid gap-3 md:grid-cols-2 lg:grid-cols-4"
      aria-label={t("navigation.aria_label")}
    >
      {navItems.map((item) => {
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
