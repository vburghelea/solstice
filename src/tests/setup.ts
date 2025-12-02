// Ensure we are in React dev/test mode for tests
process.env["NODE_ENV"] = "test";

// @ts-expect-error - This is a global variable set for React's act environment
global.IS_REACT_ACT_ENVIRONMENT = true;

import "@testing-library/jest-dom";
import { vi } from "vitest";

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

// Mock CSS imports
vi.mock("~/styles.css?url", () => ({
  default: "/test-styles.css",
}));

/**
 * Mock TanStack Start's createServerFn to enable unit testing of server functions.
 *
 * Server functions use 'use server' pragma which throws in test environments.
 * This mock bypasses that check and returns the handler function directly,
 * allowing you to test the business logic without the TanStack Start infrastructure.
 *
 * @see https://github.com/TanStack/router/discussions/2701
 *
 * Usage in tests:
 *   // Import the server function directly
 *   import { myServerFn } from '~/features/example/example.queries';
 *
 *   // Call it like a regular async function
 *   const result = await myServerFn({ data: { id: '123' } });
 */
vi.mock("@tanstack/react-start", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-start")>();
  return {
    ...original,
    createServerFn: () => {
      // Return a builder that mimics the real createServerFn API
      const builder = {
        _handler: undefined as ((args: unknown) => Promise<unknown>) | undefined,
        _validator: undefined as ((data: unknown) => unknown) | undefined,
        _middlewares: [] as unknown[],

        validator: function (validatorFn: (data: unknown) => unknown) {
          this._validator = validatorFn;
          return this;
        },

        // Alias for validator (TanStack Start uses inputValidator)
        inputValidator: function (validatorFn: (data: unknown) => unknown) {
          return this.validator(validatorFn);
        },

        middleware: function (middlewares: unknown[]) {
          this._middlewares = middlewares;
          return this;
        },

        handler: function <TResult>(
          handlerFn: (args: { data: unknown; context?: unknown }) => Promise<TResult>,
        ) {
          this._handler = handlerFn as (args: unknown) => Promise<unknown>;

          // Return a function that can be called like the real server function
          const serverFn = async (args?: { data?: unknown }) => {
            let validatedData = args?.data;

            // Run validator if present
            if (this._validator && args?.data !== undefined) {
              validatedData = this._validator(args.data);
            }

            // Call the handler with validated data
            return handlerFn({ data: validatedData, context: {} });
          };

          // Preserve the builder methods for chaining inspection in tests
          Object.assign(serverFn, {
            _handler: this._handler,
            _validator: this._validator,
            _middlewares: this._middlewares,
          });

          return serverFn;
        },
      };

      return builder;
    },
  };
});

/**
 * Mock TanStack Router for component testing.
 *
 * This provides simplified versions of router components and hooks
 * that work in isolation without a full router context.
 *
 * For tests that need real routing behavior, use createMemoryHistory
 * and createRouter with your actual route tree instead.
 */
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const React = await import("react");
  const original = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    // Simplified Link that renders as anchor
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => {
      return React.createElement("a", { href: to, ...props }, children);
    },
    // Mock useRouter for components that need navigation
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useRouter: () => ({
      navigate: vi.fn(),
      history: {
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
      },
    }),
    // Mock useNavigate for programmatic navigation
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useNavigate: () => vi.fn(),
    // Keep redirect and notFound working for server function tests
    redirect: original.redirect,
    notFound: original.notFound,
  };
});
