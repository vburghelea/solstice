import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Home,
  LogOut,
  Settings,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { auth } from "~/lib/auth-client";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Teams", href: "/dashboard/teams" },
  { icon: Calendar, label: "Events", href: "/dashboard/events" },
  { icon: UserCheck, label: "Members", href: "/dashboard/members" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
];

const bottomItems = [
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await auth.signOut();

      // Clear all cached data
      queryClient.clear();

      // Invalidate router cache
      await router.invalidate();

      // Navigate to login page
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="p-6">
        <h1 className="text-admin-text-primary text-xl font-bold">Quadball Canada</h1>
        <p className="text-admin-text-secondary text-sm">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="nav-item"
              activeOptions={{ exact: true }}
              activeProps={{
                className: "nav-item-active",
                "aria-current": "page",
                "data-status": "active",
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-gray-200 px-4 py-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="nav-item"
              activeOptions={{ exact: true }}
              activeProps={{
                className: "nav-item-active",
                "aria-current": "page",
                "data-status": "active",
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
