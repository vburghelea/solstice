import { Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { AdminSidebar } from "~/components/ui/admin-sidebar";
import { Button } from "~/components/ui/button";
import { MobileAdminHeader } from "~/components/ui/mobile-admin-header";
import { MobileTabBar } from "~/components/ui/mobile-tab-bar";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <h2 className="text-lg font-bold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-900 dark:text-gray-900"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5 text-gray-900 dark:text-gray-900" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <MobileAdminHeader onMenuClick={() => setSidebarOpen(true)} />
        {/* Add bottom padding to avoid overlap with mobile tab bar */}
        <main className="flex-1 p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        {/* Persistent mobile navigation */}
        <MobileTabBar />
      </div>
    </div>
  );
}
