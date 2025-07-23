import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Home,
  Settings,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";

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
  const location = useLocation();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="p-6">
        <h1 className="text-admin-text-primary text-xl font-bold">Quadball Canada</h1>
        <p className="text-admin-text-secondary text-sm">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(isActive ? "nav-item-active" : "nav-item")}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 px-4 py-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(isActive ? "nav-item-active" : "nav-item")}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
