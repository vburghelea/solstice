import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "~/components/ui/logo";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { authQueryKey } from "~/features/auth/auth.queries";
import { getAppNavSections } from "~/features/layouts/app-nav";
import { useOrgContext } from "~/features/organizations/org-context";
import { recordSecurityEvent } from "~/features/security/security.mutations";
import { auth } from "~/lib/auth-client";
import { getBrand } from "~/tenant";
import { filterNavItems } from "~/tenant/feature-gates";

interface AppSidebarProps {
  onNavigation?: () => void;
}

export function AppSidebar({ onNavigation }: AppSidebarProps = {}) {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;
  const { organizationRole } = useOrgContext();
  const brand = getBrand();

  const sections = useMemo(() => {
    return getAppNavSections()
      .map((section) => ({
        ...section,
        items: filterNavItems(section.items, { user, organizationRole }),
      }))
      .filter((section) => section.items.length > 0);
  }, [organizationRole, user]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      if (user?.id) {
        void recordSecurityEvent({ data: { eventType: "logout", userId: user.id } });
      }
      await auth.signOut({
        fetchOptions: {
          onResponse: async () => {
            queryClient.setQueryData(authQueryKey, null);
            await router.invalidate();
          },
        },
      });

      await navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      return;
    }

    setIsLoggingOut(false);
  };

  return (
    <aside className="flex w-72 flex-col border-r border-gray-200 bg-white">
      <div className="p-6">
        <Link to="/dashboard" className="transition-opacity hover:opacity-80">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" alt={`${brand.name} logo`} />
            <div>
              <h1 className="text-admin-text-primary text-lg font-bold">{brand.name}</h1>
              <p className="text-admin-text-secondary text-xs">{brand.portalSubtitle}</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 px-4 pb-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {section.label}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-item"
                  onClick={onNavigation}
                  {...(item.exact ? { activeOptions: { exact: true as const } } : {})}
                  activeProps={{
                    className: "nav-item-active",
                    "aria-current": "page",
                    "data-status": "active",
                  }}
                >
                  <Icon className="pointer-events-none h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item w-full text-left hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          disabled={isLoggingOut}
        >
          <LogOut className="h-5 w-5" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
