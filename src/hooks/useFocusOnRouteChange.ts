import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useLiveAnnouncer } from "~/hooks/useLiveAnnouncer";
import { getBrand } from "~/tenant";

const MAIN_CONTENT_ID = "main-content";
const USER_FOCUS_DEBOUNCE_MS = 100;
const brandName = getBrand().name;
type HistoryAction = "PUSH" | "REPLACE" | "FORWARD" | "BACK" | "GO";

const hasOpenOverlay = () => {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      '[role="dialog"][open], [role="alertdialog"][open], [aria-modal="true"], [data-radix-portal] [data-state="open"], [data-state="open"][data-radix-portal], [data-state="open"][data-portal], [data-state="open"][data-side], [data-state="open"][data-drawer]',
    ),
  );
};

const focusElement = (element: HTMLElement | null) => {
  if (!element) return;
  const hadTabIndex = element.hasAttribute("tabindex");

  if (element.tabIndex < 0 && !hadTabIndex) {
    element.setAttribute("tabindex", "-1");
  }

  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "start" });
};

export function useFocusOnRouteChange() {
  const router = useRouter();
  const routerState = useRouterState();
  const { announcePolite } = useLiveAnnouncer();
  const lastHistoryAction = useRef<HistoryAction | null>(null);
  const hasHydrated = useRef(false);
  const lastUserInteraction = useRef(0);

  useEffect(() => {
    if (!router.history?.subscribe) return;
    return router.history.subscribe(({ action }) => {
      lastHistoryAction.current = action.type;
    });
  }, [router]);

  useEffect(() => {
    const recordInteraction = () => {
      lastUserInteraction.current = performance.now();
    };

    window.addEventListener("pointerdown", recordInteraction, true);
    window.addEventListener("keydown", recordInteraction, true);

    return () => {
      window.removeEventListener("pointerdown", recordInteraction, true);
      window.removeEventListener("keydown", recordInteraction, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    const action = lastHistoryAction.current;
    if (action === "BACK" || action === "FORWARD" || action === "GO") return;
    if (hasOpenOverlay()) return;

    const now = performance.now();
    if (now - lastUserInteraction.current < USER_FOCUS_DEBOUNCE_MS) return;

    const tryFocusAnchor = () => {
      const hash = routerState.location.hash;
      if (hash && hash.length > 1) {
        const anchorId = decodeURIComponent(hash.slice(1));
        const anchor = document.getElementById(anchorId);
        if (anchor) {
          focusElement(anchor);
          return true;
        }
      }
      return false;
    };

    const focusMainContent = () => {
      const main =
        document.getElementById(MAIN_CONTENT_ID) ??
        (document.querySelector("main") as HTMLElement | null);
      focusElement(main);
    };

    const timeout = window.setTimeout(() => {
      if (tryFocusAnchor()) return;
      focusMainContent();
      if (!document.title || document.title === brandName) {
        const segments = routerState.location.pathname.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1] ?? "Dashboard";
        const formatted =
          lastSegment === "dashboard"
            ? "Dashboard"
            : lastSegment
                .replace(/[-_]/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());
        const nextTitle = formatted ? `${formatted} | ${brandName}` : brandName;
        document.title = nextTitle;
      }
      if (document.title) {
        announcePolite(document.title);
      }
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [
    announcePolite,
    routerState.location.hash,
    routerState.location.href,
    routerState.location.pathname,
    routerState.location.search,
  ]);
}
