import { StartClient } from "@tanstack/react-start";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { subscribeToRouterDiagnostics } from "./diagnostics/routerDiagnostics";
import { createRouter } from "./router";

const router = createRouter();

const unsubscribeRouterDiagnostics = subscribeToRouterDiagnostics(router);

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__ROUTER__ = router;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => unsubscribeRouterDiagnostics?.());
}

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
);
