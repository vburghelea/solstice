import { Menu } from "lucide-react";
import { NotificationBell } from "~/features/notifications/components/notification-bell";
import { Button } from "./button";

interface MobileAdminHeaderProps {
  onMenuClick: () => void;
}

export function MobileAdminHeader({ onMenuClick }: MobileAdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-admin-text-primary text-lg font-bold">Quadball Canada</h1>
            <p className="text-admin-text-secondary text-xs">Admin Panel</p>
          </div>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
