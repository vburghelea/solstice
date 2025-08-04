import { StartClient } from "@tanstack/react-start";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";

const router = createRouter();

// Add debug logging
router.subscribe("onNavigateStart", () => {
  console.log("Navigation starting...");
});

router.subscribe("onNavigateEnd", () => {
  console.log("Navigation ended");
});

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
);
