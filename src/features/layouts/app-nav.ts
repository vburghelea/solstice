import {
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  LineChart,
  Settings,
  ShieldCheck,
  UploadCloud,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAdminNav } from "./admin-nav";
import type { NavItem, NavSection } from "./nav.types";

const analyticsRoles: OrganizationRole[] = ["owner", "admin", "reporter"];

const portalItems: NavItem[] = [
  {
    icon: Home,
    label: "Dashboard",
    to: "/dashboard",
    exact: true,
    feature: "qc_portal",
  },
  {
    icon: LayoutGrid,
    label: "SIN Portal",
    to: "/dashboard/sin",
    exact: true,
    feature: "sin_portal",
  },
  {
    icon: CreditCard,
    label: "Membership",
    to: "/dashboard/membership",
    feature: "qc_membership",
  },
  {
    icon: Users,
    label: "Teams",
    to: "/dashboard/teams",
    feature: "qc_teams",
  },
  {
    icon: Calendar,
    label: "Events",
    to: "/dashboard/events",
    feature: "qc_events",
  },
  {
    icon: UserCheck,
    label: "Members",
    to: "/dashboard/members",
    feature: "qc_members_directory",
  },
  {
    icon: BarChart3,
    label: "Reports",
    to: "/dashboard/reports",
    feature: "qc_reports",
  },
  {
    icon: ClipboardList,
    label: "Reporting",
    to: "/dashboard/sin/reporting",
    feature: "sin_reporting",
  },
  {
    icon: FileText,
    label: "Forms",
    to: "/dashboard/sin/forms",
    feature: "sin_forms",
  },
  {
    icon: UploadCloud,
    label: "Imports",
    to: "/dashboard/sin/imports",
    feature: "sin_imports",
  },
  {
    icon: LineChart,
    label: "Analytics",
    to: "/dashboard/sin/analytics",
    feature: "sin_analytics",
    requiresOrgRole: analyticsRoles,
  },
];

const accountItems: NavItem[] = [
  {
    icon: User,
    label: "Profile",
    to: "/dashboard/profile",
    exact: true,
  },
  {
    icon: Settings,
    label: "Settings",
    to: "/dashboard/settings",
    exact: true,
  },
  {
    icon: ShieldCheck,
    label: "Privacy",
    to: "/dashboard/privacy",
    exact: true,
  },
];

export const getPortalNav = (): NavSection => ({
  label: "Portal",
  items: [...portalItems],
});

export const getAdminConsoleNav = (): NavSection => ({
  label: "Admin Console",
  items: getAdminNav(),
});

export const getAccountNav = (): NavSection => ({
  label: "Account",
  items: [...accountItems],
});

export const getAppNavSections = (): NavSection[] => [
  getPortalNav(),
  getAdminConsoleNav(),
  getAccountNav(),
];
