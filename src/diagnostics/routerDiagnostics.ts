import type { RouterEvents } from "@tanstack/react-router";
import type { AppRouter } from "~/router";

/**
 * Subscribe to a few router events for simple, typed diagnostics.
 * No-ops unless VITE_ROUTER_DEBUG === "true". Returns an unsubscribe function.
 */
export function subscribeToRouterDiagnostics(
  router: AppRouter,
  opts?: {
    logger?: (message: string, evt?: RouterEvents[keyof RouterEvents]) => void;
  },
) {
  const shouldLog = import.meta.env.VITE_ROUTER_DEBUG === "true";
  const log =
    opts?.logger ??
    ((msg: string, evt?: RouterEvents[keyof RouterEvents]) => {
      console.log(msg, evt);
    });

  if (!shouldLog) {
    return () => {};
  }

  let navStartAt = 0;
  const unsubs: Array<() => void> = [];

  unsubs.push(
    router.subscribe("onBeforeNavigate", (evt) => {
      navStartAt = typeof performance !== "undefined" ? performance.now() : 0;
      log(`▶︎ [router] onBeforeNavigate → ${evt.toLocation.href}`, evt);
    }),
  );

  unsubs.push(
    router.subscribe("onResolved", (evt) => {
      log(`✓ [router] onResolved → ${evt.toLocation.href}`, evt);
    }),
  );

  unsubs.push(
    router.subscribe("onRendered", (evt) => {
      const ms =
        navStartAt && typeof performance !== "undefined"
          ? Math.round(performance.now() - navStartAt)
          : undefined;

      log(
        `🎯 [router] onRendered → ${evt.toLocation.href}${ms ? ` (${ms}ms)` : ""}`,
        evt,
      );
    }),
  );

  return () => {
    for (const off of unsubs) {
      try {
        off();
      } catch {
        // ignore
      }
    }
  };
}
