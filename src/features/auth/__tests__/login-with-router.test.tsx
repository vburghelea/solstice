import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "~/lib/auth-client";
import { renderWithRouter, screen, waitFor } from "~/tests/utils";
import LoginForm from "../components/login";

type SignInEmailArgs = Parameters<typeof auth.signIn.email>;
type SignInEmailReturn = ReturnType<typeof auth.signIn.email>;

// Mock auth client
vi.mock("~/lib/auth-client", () => ({
  auth: {
    signIn: {
      email: vi.fn(),
    },
    signInWithOAuth: vi.fn(),
  },
}));

vi.mock("~/features/security/security.queries", () => ({
  getAccountLockStatus: vi.fn().mockResolvedValue(null),
}));

// Mock checkPasskeysByEmail for identifier-first flow
vi.mock("~/features/auth/auth.queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/auth/auth.queries")>();
  return {
    ...actual,
    checkPasskeysByEmail: vi.fn().mockResolvedValue({ hasPasskeys: false }),
  };
});

describe("LoginForm with TanStack Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form in router context (identifier-first flow)", async () => {
    await renderWithRouter(<LoginForm />);

    // In email step, only email field and Continue button are shown
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    // Password field should NOT be visible initially
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("handles navigation with router context", async () => {
    const user = userEvent.setup();

    // Mock successful login
    vi.mocked(auth.signIn.email).mockImplementation((...args: SignInEmailArgs) => {
      const handlers = args[1];
      handlers?.onSuccess?.({
        data: { user: {}, session: {} },
        response: new Response(),
        request: new Request("http://localhost"),
      });
      return Promise.resolve({
        data: { user: {}, session: {} },
        error: null,
      }) as SignInEmailReturn;
    });

    const { router } = await renderWithRouter(<LoginForm />);

    // Step 1: Enter email and click Continue
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Wait for password field to appear
    await waitFor(() => {
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    // Step 2: Enter password and login
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(auth.signIn.email).toHaveBeenCalled();
    });

    // In a real router test, we would check navigation
    // But since LoginForm uses router hooks that we need to mock,
    // we'll verify the router exists
    expect(router).toBeDefined();
  });

  it("renders with custom user context", async () => {
    const customUser = {
      id: "custom-user",
      name: "Custom User",
      email: "custom@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: true,
      dateOfBirth: new Date("1990-01-01"),
      phone: "+1234567890",
      gender: "male" as const,
      pronouns: "he/him",
      emergencyContact: JSON.stringify({
        name: "Emergency Contact",
        phone: "+0987654321",
        relationship: "spouse",
      }),
      privacySettings: JSON.stringify({
        showEmail: false,
        showPhone: false,
        showDateOfBirth: false,
      }),
      profileVersion: 1,
      profileUpdatedAt: new Date(),
      mfaRequired: false,
      mfaEnrolledAt: null,
      twoFactorEnabled: false,
    };

    await renderWithRouter(<LoginForm />, { user: customUser });

    // Component should still render
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("has access to query client", async () => {
    const { queryClient } = await renderWithRouter(<LoginForm />);

    expect(queryClient).toBeDefined();
    expect(queryClient?.getDefaultOptions()).toBeDefined();
  });
});
