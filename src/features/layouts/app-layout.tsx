import { Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { Breadcrumbs } from "~/components/ui/breadcrumbs";
import { Button } from "~/components/ui/button";
import { MobileAppHeader } from "~/components/ui/mobile-app-header";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-2 z-10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex-1 overflow-y-auto">
              <AppSidebar onNavigation={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <MobileAppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
