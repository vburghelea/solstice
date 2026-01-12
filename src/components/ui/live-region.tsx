import React, { useEffect, useMemo, useRef, useState } from "react";
import { type ToastT, useSonner } from "sonner";
import {
  LiveAnnouncerContext,
  type LiveAnnouncerContextValue,
  useLiveAnnouncer,
} from "~/hooks/useLiveAnnouncer";

type LiveRegionProps = {
  politeMessage: string;
  assertiveMessage: string;
};

const resetAndAnnounce = (
  setter: React.Dispatch<React.SetStateAction<string>>,
  message: string,
) => {
  if (!message) {
    setter("");
    return;
  }

  if (typeof window === "undefined") {
    setter(message);
    return;
  }

  setter("");
  window.requestAnimationFrame(() => {
    setter(message);
  });
};

function LiveRegions({ politeMessage, assertiveMessage }: LiveRegionProps) {
  return (
    <div className="sr-only">
      <div aria-live="polite" aria-atomic="true">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true">
        {assertiveMessage}
      </div>
    </div>
  );
}

export function LiveAnnouncerProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const announce = (
    message: string,
    options?: { politeness?: "polite" | "assertive" },
  ) => {
    if (options?.politeness === "assertive") {
      resetAndAnnounce(setAssertiveMessage, message);
      return;
    }
    resetAndAnnounce(setPoliteMessage, message);
  };

  const contextValue = useMemo<LiveAnnouncerContextValue>(
    () => ({
      announce,
      announcePolite: (message: string) => announce(message, { politeness: "polite" }),
      announceAssertive: (message: string) =>
        announce(message, { politeness: "assertive" }),
      clear: () => {
        setPoliteMessage("");
        setAssertiveMessage("");
      },
    }),
    [],
  );

  return (
    <LiveAnnouncerContext value={contextValue}>
      {children}
      <LiveRegions politeMessage={politeMessage} assertiveMessage={assertiveMessage} />
    </LiveAnnouncerContext>
  );
}

const getToastMessage = (toast: ToastT) => {
  if (typeof toast.title === "string") return toast.title;
  if (typeof toast.description === "string") return toast.description;
  if (typeof toast.jsx === "string") return toast.jsx;
  return null;
};

export function ToastAnnouncements() {
  const { toasts } = useSonner();
  const { announcePolite } = useLiveAnnouncer();
  const seenToastIds = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    const currentIds = new Set<string | number>();

    for (const toast of toasts) {
      currentIds.add(toast.id);
      if ("delete" in toast && (toast as { delete?: boolean }).delete) continue;
      if (seenToastIds.current.has(toast.id)) continue;

      const message = getToastMessage(toast);
      if (message) {
        announcePolite(message);
      }
      seenToastIds.current.add(toast.id);
    }

    seenToastIds.current.forEach((id) => {
      if (!currentIds.has(id)) {
        seenToastIds.current.delete(id);
      }
    });
  }, [announcePolite, toasts]);

  return null;
}
