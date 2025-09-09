// Ensure we are in React dev/test mode for tests
process.env["NODE_ENV"] = "test";

// @ts-expect-error - This is a global variable set for React's act environment
global.IS_REACT_ACT_ENVIRONMENT = true;

import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { setupCampaignMocks } from "~/tests/mocks/campaigns";
import { setupGameMocks } from "~/tests/mocks/games";
import { mockReactQuery, setupReactQueryMocks } from "~/tests/mocks/react-query";

mockReactQuery();
// Provide default return values for common queries used across tests
setupReactQueryMocks();

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Polyfill Pointer Events APIs used by Radix UI in JSDOM
// JSDOM does not implement pointer capture helpers; provide safe no-ops
// to avoid runtime errors when components call them during tests.
Object.defineProperty(window.HTMLElement.prototype, "hasPointerCapture", {
  value: () => false,
  configurable: true,
});
Object.defineProperty(window.HTMLElement.prototype, "setPointerCapture", {
  value: () => {},
  configurable: true,
});
Object.defineProperty(window.HTMLElement.prototype, "releasePointerCapture", {
  value: () => {},
  configurable: true,
});

// Provide a minimal PointerEvent polyfill if missing
if (typeof window.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(
      type: string,
      props?: MouseEventInit & {
        pointerId?: number;
        pointerType?: string;
        isPrimary?: boolean;
      },
    ) {
      super(type, props);
      this.pointerId = props?.pointerId ?? 1;
      this.pointerType = props?.pointerType ?? "mouse";
      this.isPrimary = props?.isPrimary ?? true;
    }
  }
  Object.defineProperty(window, "PointerEvent", {
    value: PointerEvent,
    configurable: true,
  });
}

// Mock environment variables for tests
vi.mock("~/lib/env.server", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test",
    DATABASE_URL_UNPOOLED: "postgresql://test",
    BETTER_AUTH_SECRET: "test-secret",
    VITE_BASE_URL: "http://localhost:3000",
  },
  isServerless: () => false,
}));

vi.mock("~/features/auth/auth.queries", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock CSS imports
vi.mock("~/styles.css?url", () => ({
  default: "/test-styles.css",
}));

// Mock sonner globally
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
    Toaster: vi.fn(() => null), // Mock Toaster component to render nothing
  };
});

// Polyfill scrollIntoView for libraries that call it in JSDOM
// Some components (e.g., cmdk) use scrollIntoView on mount/selection
Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
  configurable: true,
});

// Reset mocks before each test
beforeEach(() => {
  setupCampaignMocks();
  setupGameMocks();
});
