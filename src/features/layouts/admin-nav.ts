import { Building2, Home, ShieldCheck } from "lucide-react";
import type { NavItem } from "./nav.types";

export const getAdminNav = (): NavItem[] => [
  {
    icon: Home,
    label: "Admin Home",
    to: "/dashboard/admin",
    exact: true,
    requiresGlobalAdmin: true,
  },
  {
    icon: ShieldCheck,
    label: "Roles",
    to: "/dashboard/admin/roles",
    requiresGlobalAdmin: true,
  },
  {
    icon: Building2,
    label: "SIN Admin",
    to: "/dashboard/admin/sin",
    requiresGlobalAdmin: true,
    feature: "sin_admin",
  },
];
