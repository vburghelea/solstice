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
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouterState: () => ({ location: { pathname: "/auth/login" } }),
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouter: () => ({ invalidate: vi.fn() }),
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

// Mock SafeLink
vi.mock("~/components/ui/SafeLink", () => ({
  SafeLink: ({
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

vi.mock("~/features/security/security.mutations", () => ({
  recordSecurityEvent: vi.fn(),
}));

vi.mock("~/features/security/security.queries", () => ({
  getAccountLockStatus: vi.fn().mockResolvedValue(null),
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

    // Check for social login button
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeInTheDocument();

    // Check for signup link
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/auth/signup",
    );
  });

  it("handles successful email login", async () => {
    const user = userEvent.setup();
    const { mockUser, mockSession } = createAuthMocks();

    // Setup successful login response
    vi.mocked(auth.signIn.email).mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    render(<LoginForm />);

    // Fill in form
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      // Verify auth client was called
      expect(auth.signIn.email).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

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
    vi.mocked(auth.signIn.email).mockResolvedValueOnce({
      data: null,
      error: {
        message: errorMessage,
      },
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
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();

    // Social login button should also be disabled
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeDisabled();
  });

  it("handles Google social login", async () => {
    const user = userEvent.setup();
    const { mockUser } = createAuthMocks();

    vi.mocked(auth.signInWithOAuth).mockResolvedValueOnce({
      redirect: true,
      token: "mock-token",
      url: undefined,
      user: mockUser,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login with Google" }));

    expect(auth.signInWithOAuth).toHaveBeenCalledWith(
      {
        provider: "google",
        callbackURL: "/dashboard",
      },
      expect.objectContaining({
        onRequest: expect.any(Function),
        onError: expect.any(Function),
      }),
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
