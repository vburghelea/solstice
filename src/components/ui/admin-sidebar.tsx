import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  FileText,
  CheckSquare,
  Home,
  Layers3,
  LogOut,
  ScrollText,
  Settings,
  Swords,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { userHasRole } from "~/features/roles/permission.service";
import { auth } from "~/lib/auth-client";

type SidebarItem = {
  icon: typeof Home;
  label: string;
  href: string;
  requiresRole?: boolean;
  roles?: string[];
};

type AdminSidebarProps = {
  onNavigate?: () => void;
};

const primarySidebarItems: SidebarItem[] = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Swords, label: "Games", href: "/dashboard/games" },
  { icon: ScrollText, label: "Campaigns", href: "/dashboard/campaigns" },
  { icon: Users, label: "Teams", href: "/dashboard/teams" },
  { icon: Calendar, label: "Events", href: "/dashboard/events" },
  { icon: UserCheck, label: "Members", href: "/dashboard/members" },
];

const adminSidebarItems: SidebarItem[] = [
  {
    icon: Layers3,
    label: "Systems",
    href: "/dashboard/systems",
    requiresRole: true,
    roles: ["Platform Admin", "Games Admin"],
  },
  {
    icon: CheckSquare,
    label: "Event Review",
    href: "/admin/events-review",
    requiresRole: true,
    roles: ["Solstice Admin", "Quadball Canada Admin"],
  },
  {
    icon: BarChart3,
    label: "Reports",
    href: "/dashboard/reports",
    requiresRole: true,
    roles: ["Platform Admin", "Games Admin"],
  },
  {
    icon: FileText,
    label: "Social Audits",
    href: "/dashboard/social-audits",
    requiresRole: true,
    roles: ["Platform Admin", "Games Admin"],
  },
  {
    icon: ShieldCheck,
    label: "Roles",
    href: "/admin/roles",
    requiresRole: true,
    roles: ["Solstice Admin", "Quadball Canada Admin"],
  },
];

const bottomItems = [
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function AdminSidebar({ onNavigate }: AdminSidebarProps = {}) {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;

  const filterItemsForUser = (items: SidebarItem[]) =>
    items.filter((item) => {
      if (!item.requiresRole) return true;
      if (!user || !item.roles) return false;

      return item.roles.some((roleName) => userHasRole(user, roleName));
    });

  const primaryItems = filterItemsForUser(primarySidebarItems);
  const adminItems = filterItemsForUser(adminSidebarItems);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Use Better Auth's signOut
      await auth.signOut();

      // Clear client state
      queryClient.clear();

      // Force hard navigation to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even on error, clear state and navigate to login
      queryClient.clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground flex h-full w-full max-w-[var(--admin-sidebar-width,16rem)] flex-col border-r">
      <div className="px-6 pt-8 pb-6">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <h1 className="text-lg font-semibold">Roundup Games</h1>
          <p className="text-muted-foreground text-sm">Dashboard</p>
        </Link>
      </div>
      <nav className="flex-1 space-y-6 px-4 py-2" aria-label="Admin navigation">
        <div className="space-y-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="nav-item"
                activeProps={{
                  className: "nav-item-active",
                  "aria-current": "page",
                  "data-status": "active",
                }}
                onClick={onNavigate}
              >
                <Icon className="pointer-events-none h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {adminItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground/80 px-2 text-xs font-semibold tracking-wide uppercase">
              Admin tools
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="nav-item"
                  activeProps={{
                    className: "nav-item-active",
                    "aria-current": "page",
                    "data-status": "active",
                  }}
                  onClick={onNavigate}
                >
                  <Icon className="pointer-events-none h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      <div className="border-border space-y-2 border-t px-4 py-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="nav-item"
              activeProps={{
                className: "nav-item-active",
                "aria-current": "page",
                "data-status": "active",
              }}
              onClick={onNavigate}
            >
              <Icon className="pointer-events-none h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item hover:bg-destructive/10 hover:text-destructive w-full text-left disabled:opacity-60"
          disabled={isLoggingOut}
        >
          <LogOut className="h-5 w-5" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
