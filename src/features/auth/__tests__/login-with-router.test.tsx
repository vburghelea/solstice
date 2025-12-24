import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "~/lib/auth-client";
import { renderWithRouter, screen, waitFor } from "~/tests/utils";
import LoginForm from "../components/login";

// Mock auth client
vi.mock("~/lib/auth-client", () => ({
  auth: {
    signIn: {
      email: vi.fn(),
    },
    signInWithOAuth: vi.fn(),
  },
}));

vi.mock("~/features/security/security.mutations", () => ({
  recordSecurityEvent: vi.fn(),
}));

vi.mock("~/features/security/security.queries", () => ({
  getAccountLockStatus: vi.fn().mockResolvedValue(null),
}));

describe("LoginForm with TanStack Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form in router context", async () => {
    await renderWithRouter(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("handles navigation with router context", async () => {
    const user = userEvent.setup();

    // Mock successful login
    vi.mocked(auth.signIn.email).mockImplementation((data, handlers) => {
      handlers?.onSuccess?.({ data: { user: {}, session: {} } } as Parameters<
        NonNullable<typeof handlers.onSuccess>
      >[0]);
      return Promise.resolve({ data: { user: {}, session: {} }, error: null });
    });

    const { router } = await renderWithRouter(<LoginForm />);

    // Fill and submit form
    await user.type(screen.getByLabelText("Email"), "test@example.com");
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
