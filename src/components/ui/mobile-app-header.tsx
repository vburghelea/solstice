import { Menu } from "lucide-react";
import { NotificationBell } from "~/features/notifications/components/notification-bell";
import { getBrand } from "~/tenant";
import { Button } from "./button";
import { Logo } from "./logo";

interface MobileAppHeaderProps {
  onMenuClick: () => void;
}

export function MobileAppHeader({ onMenuClick }: MobileAppHeaderProps) {
  const brand = getBrand();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" alt={`${brand.name} logo`} />
            <div>
              <h1 className="text-admin-text-primary text-base font-bold">
                {brand.name}
              </h1>
              <p className="text-admin-text-secondary text-xs">{brand.portalSubtitle}</p>
            </div>
          </div>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
