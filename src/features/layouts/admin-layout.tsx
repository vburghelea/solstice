import { Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { AdminSidebar } from "~/components/ui/admin-sidebar";
import { Breadcrumbs } from "~/components/ui/breadcrumbs";
import { Button } from "~/components/ui/button";
import { MobileAdminHeader } from "~/components/ui/mobile-admin-header";
import { MobileTabBar } from "~/components/ui/mobile-tab-bar";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const layoutStyles = {
    "--admin-sidebar-width": "16rem",
    "--admin-mobile-nav-height": "3.5rem",
    "--admin-mobile-safe-area": "env(safe-area-inset-bottom)",
    "--admin-mobile-main-padding":
      "calc(var(--admin-mobile-nav-height) + var(--admin-mobile-safe-area) + 2.25rem)",
    "--admin-sticky-offset":
      "calc(var(--admin-mobile-nav-height) + var(--admin-mobile-safe-area) + 0.75rem)",
  } as CSSProperties;

  return (
    <div
      className="bg-background text-foreground min-h-dvh w-full lg:grid lg:grid-cols-[var(--admin-sidebar-width)_1fr]"
      style={layoutStyles}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:h-full lg:flex-col">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="border-border bg-background fixed inset-y-0 left-0 flex w-full max-w-[min(90vw,20rem)] flex-col border-r shadow-xl">
            <div className="border-border flex h-16 items-center justify-between border-b px-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileAdminHeader onMenuClick={() => setSidebarOpen(true)} />
        {/* Add bottom padding to avoid overlap with mobile tab bar */}
        <main className="flex-1 px-4 pt-4 pb-[var(--admin-mobile-main-padding)] sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-screen-2xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
        {/* Persistent mobile navigation */}
        <MobileTabBar />
      </div>
    </div>
  );
}
