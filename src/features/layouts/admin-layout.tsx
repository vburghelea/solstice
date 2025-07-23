import { AdminSidebar } from "@/shared/ui/admin-sidebar";
import { Button } from "@/shared/ui/button";
import { MobileAdminHeader } from "@/shared/ui/mobile-admin-header";
import { Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";

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
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
