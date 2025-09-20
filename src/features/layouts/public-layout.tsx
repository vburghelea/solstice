import { InstallPrompt } from "~/components/ui/install-prompt";
import { PublicFooter } from "~/components/ui/public-footer";
import { PublicHeader } from "~/components/ui/public-header";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
      <InstallPrompt />
    </div>
  );
}
