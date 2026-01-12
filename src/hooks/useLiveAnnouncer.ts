import { createContext, use } from "react";

type AnnounceOptions = {
  politeness?: "polite" | "assertive";
};

export type LiveAnnouncerContextValue = {
  announce: (message: string, options?: AnnounceOptions) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  clear: () => void;
};

export const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

export function useLiveAnnouncer() {
  const context = use(LiveAnnouncerContext);
  if (!context) {
    throw new Error("useLiveAnnouncer must be used within LiveAnnouncerProvider");
  }
  return context;
}
