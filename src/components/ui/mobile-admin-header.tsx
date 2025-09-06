import { Menu } from "lucide-react";
import { Button } from "./button";

interface MobileAdminHeaderProps {
  onMenuClick: () => void;
}

export function MobileAdminHeader({ onMenuClick }: MobileAdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-admin-text-primary text-gray-900 dark:text-gray-900"
            aria-label="Open admin menu"
          >
            <Menu className="text-admin-text-primary h-6 w-6 text-gray-900 dark:text-gray-900" />
          </Button>
          <div>
            <h1 className="text-admin-text-primary text-lg font-bold">Roundup Games</h1>
            <p className="text-admin-text-secondary text-xs">Admin Panel</p>
          </div>
        </div>
      </div>
    </header>
  );
}
