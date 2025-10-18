import "@testing-library/jest-dom";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: vi.fn(),
  createMemoryHistory: vi.fn(() => ({
    location: { pathname: "/" },
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    createHref: vi.fn((to) => to),
  })),
  RouterProvider: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useRouter: vi.fn(() => ({
    invalidate: vi.fn(),
  })),
  useRouteContext: vi.fn(() => ({
    user: null,
  })),
}));

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock navigator
Object.defineProperty(window, "navigator", {
  value: {
    languages: ["en-US", "en"],
  },
  writable: true,
});

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  get: () => "",
  set: vi.fn(),
  configurable: true,
});
