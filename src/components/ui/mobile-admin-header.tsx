import { Menu } from "lucide-react";
import { Button } from "./button";

interface MobileAdminHeaderProps {
  onMenuClick: () => void;
}

export function MobileAdminHeader({ onMenuClick }: MobileAdminHeaderProps) {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 border-b backdrop-blur lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Open admin menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-base font-semibold">Roundup Games</h1>
            <p className="text-muted-foreground text-xs">Admin Panel</p>
          </div>
        </div>
      </div>
    </header>
  );
}
