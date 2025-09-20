import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { DownloadIcon } from "~/components/ui/icons";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = "qc-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      return;
    }

    const handler: EventListener = (event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) {
    return null;
  }

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  return (
    <div className="fixed inset-x-4 bottom-6 z-50 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-6 sm:w-80">
      <div className="flex items-start gap-3">
        <div className="bg-brand-red/10 text-brand-red rounded-full p-2">
          <DownloadIcon className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-left">
          <p className="text-sm font-semibold text-gray-900">Install Quadball Canada</p>
          <p className="text-xs text-gray-600">
            Add the app to your home screen for quick access to schedules, resources, and
            updates—no browser tab required.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Not now
        </Button>
        <Button className="btn-brand-primary" size="sm" onClick={handleInstall}>
          Install
        </Button>
      </div>
    </div>
  );
}
