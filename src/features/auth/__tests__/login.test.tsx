import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks before imports
const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();

// Mock auth client
vi.mock("~/lib/auth-client", () => ({
  auth: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
  default: {
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useNavigate: () => mockNavigate,
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouteContext: () => ({ redirectUrl: "/dashboard" }),
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

import { auth } from "~/lib/auth-client";
import { createAuthMocks } from "~/tests/mocks/auth";
import { render, screen, waitFor } from "~/tests/utils";
import LoginForm from "../components/login";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all elements", () => {
    render(<LoginForm />);

    // Check for form elements
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();

    // Check for social login buttons
    expect(screen.getByRole("button", { name: "Login with GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeInTheDocument();

    // Check for signup link
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("handles successful email login", async () => {
    const user = userEvent.setup();
    const { mockUser, mockSession } = createAuthMocks();

    // Setup successful login response
    vi.mocked(auth.signIn.email).mockImplementationOnce((data, handlers) => {
      handlers?.onSuccess?.({
        data: {
          user: mockUser,
          session: mockSession,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      return Promise.resolve({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
    });

    render(<LoginForm />);

    // Fill in form
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      // Verify auth client was called
      expect(auth.signIn.email).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          password: "password123",
          callbackURL: "/dashboard",
        },
        expect.any(Object),
      );

      // Verify queries were invalidated
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["user"] });

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });
  });

  it("displays error message on failed login", async () => {
    const user = userEvent.setup();
    const errorMessage = "Invalid email or password";

    // Setup failed login response
    vi.mocked(auth.signIn.email).mockImplementationOnce((data, handlers) => {
      const error = {
        status: 401,
        statusText: "Unauthorized",
        error: { message: errorMessage },
        name: "BetterFetchError" as const,
        message: errorMessage,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      handlers?.onError?.(error);
      return Promise.reject(new Error(errorMessage));
    });

    render(<LoginForm />);

    // Fill in form
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("disables form during submission", async () => {
    const user = userEvent.setup();

    // Setup delayed login response
    vi.mocked(auth.signIn.email).mockImplementationOnce(() => {
      return new Promise(() => {}); // Never resolves
    });

    render(<LoginForm />);

    // Fill in form
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Login" }));

    // Check loading state
    expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Password")).toHaveAttribute("readonly");

    // Social login buttons should also be disabled
    expect(screen.getByRole("button", { name: "Login with GitHub" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeDisabled();
  });

  it("handles GitHub social login", async () => {
    const user = userEvent.setup();
    const { mockUser } = createAuthMocks();

    vi.mocked(auth.signInWithOAuth).mockImplementationOnce((data, handlers) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handlers?.onRequest?.({} as any);
      return Promise.resolve({
        redirect: true,
        token: "mock-token",
        url: undefined,
        user: mockUser,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login with GitHub" }));

    expect(auth.signInWithOAuth).toHaveBeenCalledWith(
      {
        provider: "github",
        callbackURL: "/dashboard",
      },
      expect.any(Object),
    );
  });

  it("handles Google social login", async () => {
    const user = userEvent.setup();
    const { mockUser } = createAuthMocks();

    vi.mocked(auth.signInWithOAuth).mockImplementationOnce((data, handlers) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handlers?.onRequest?.({} as any);
      return Promise.resolve({
        redirect: true,
        token: "mock-token",
        url: undefined,
        user: mockUser,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login with Google" }));

    expect(auth.signInWithOAuth).toHaveBeenCalledWith(
      {
        provider: "google",
        callbackURL: "/dashboard",
      },
      expect.any(Object),
    );
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    // Try to submit empty form
    await user.click(screen.getByRole("button", { name: "Login" }));

    // Auth client should not be called
    expect(auth.signIn.email).not.toHaveBeenCalled();
  });
});
