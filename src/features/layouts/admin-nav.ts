import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Home,
  Settings,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { GLOBAL_ADMIN_ROLE_NAMES } from "~/lib/auth/utils/admin-check";

export type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
  roles?: string[];
};

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { icon: Home, label: "Dashboard", to: "/dashboard", exact: true },
  { icon: Users, label: "Teams", to: "/dashboard/teams" },
  { icon: Calendar, label: "Events", to: "/dashboard/events" },
  { icon: UserCheck, label: "Members", to: "/dashboard/members" },
  {
    icon: BarChart3,
    label: "Reports",
    to: "/dashboard/reports",
    roles: GLOBAL_ADMIN_ROLE_NAMES,
  },
  {
    icon: ShieldCheck,
    label: "Roles",
    to: "/dashboard/admin/roles",
    roles: GLOBAL_ADMIN_ROLE_NAMES,
  },
];

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = [
  { icon: User, label: "Profile", to: "/dashboard/profile", exact: true },
  { icon: Settings, label: "Settings", to: "/dashboard/settings", exact: true },
];
