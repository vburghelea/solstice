"use client";

import { useConsentManager } from "@c15t/react";
import { cn } from "~/shared/lib/utils";

export function CookiePreferencesTrigger({ className }: { className?: string }) {
  const { setIsPrivacyDialogOpen } = useConsentManager();

  return (
    <button
      type="button"
      className={cn(
        "focus-visible:ring-offset-brand-dark text-gray-400 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none",
        "underline-offset-4 hover:underline",
        className,
      )}
      onClick={() => setIsPrivacyDialogOpen(true)}
    >
      Cookie preferences
    </button>
  );
}
