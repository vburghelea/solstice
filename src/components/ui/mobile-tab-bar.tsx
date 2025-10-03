import { Calendar, Home, ScrollText, Swords } from "lucide-react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { cn } from "~/shared/lib/utils";

interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

export function MobileTabBar() {
  const items: TabItem[] = [
    { key: "dashboard", label: "Home", icon: Home, to: "/dashboard" },
    { key: "events", label: "Events", icon: Calendar, to: "/dashboard/events" },
    { key: "games", label: "Games", icon: Swords, to: "/dashboard/games" },
    {
      key: "campaigns",
      label: "Campaigns",
      icon: ScrollText,
      to: "/dashboard/campaigns",
    },
  ];

  return (
    <nav
      className={cn(
        "border-border bg-background/95 supports-[backdrop-filter]:bg-background/75 fixed inset-x-0 bottom-0 z-40 border-t shadow-lg backdrop-blur lg:hidden",
      )}
      style={{
        paddingBottom: "calc(var(--admin-mobile-safe-area, env(safe-area-inset-bottom)))",
      }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-between">
        {items.map(({ key, label, icon: Icon, to }) => (
          <li key={key} className="flex-1">
            <Link
              to={to}
              className={cn(
                "text-muted-foreground flex h-[var(--admin-mobile-nav-height,3.5rem)] items-center justify-center",
                "data-[status=active]:text-primary",
              )}
              activeProps={{
                className: "text-primary",
                "aria-current": "page",
              }}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
