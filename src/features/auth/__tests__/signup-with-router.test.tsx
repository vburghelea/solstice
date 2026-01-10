import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "~/lib/auth-client";
import { renderWithRouter, screen, waitFor } from "~/tests/utils";
import SignupForm from "../components/signup";

type SignUpEmailArgs = Parameters<typeof auth.signUp.email>;
type SignUpEmailReturn = ReturnType<typeof auth.signUp.email>;

// Mock auth client
vi.mock("~/lib/auth-client", () => ({
  auth: {
    signUp: {
      email: vi.fn(),
    },
    signInWithOAuth: vi.fn(),
  },
}));

describe("SignupForm with Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup form with all fields", async () => {
    await renderWithRouter(<SignupForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });

  it("validates password confirmation", async () => {
    const user = userEvent.setup();

    await renderWithRouter(<SignupForm />);

    // Fill form with mismatched passwords
    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "SecurePassword123!");
    await user.type(screen.getByLabelText("Confirm Password"), "SecurePassword456!");

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    // Should show password mismatch error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Auth should not be called
    expect(auth.signUp.email).not.toHaveBeenCalled();
  });

  it("handles successful signup", async () => {
    const user = userEvent.setup();

    vi.mocked(auth.signUp.email).mockImplementation((...args: SignUpEmailArgs) => {
      const handlers = args[1];
      handlers?.onSuccess?.({
        data: { user: {}, session: {} },
        response: new Response(),
        request: new Request("http://localhost"),
      });
      return Promise.resolve({
        data: { user: {}, session: {} },
        error: null,
      }) as SignUpEmailReturn;
    });

    const { router } = await renderWithRouter(<SignupForm />);

    // Fill form correctly
    await user.type(screen.getByLabelText("Name"), "New User");
    await user.type(screen.getByLabelText("Email"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "SecurePassword123!");
    await user.type(screen.getByLabelText("Confirm Password"), "SecurePassword123!");

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(auth.signUp.email).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newuser@example.com",
          password: "SecurePassword123!",
          name: "New User",
          callbackURL: "/dashboard",
        }),
      );
    });

    // Verify router exists for navigation
    expect(router).toBeDefined();
  });

  it("displays login link", async () => {
    await renderWithRouter(<SignupForm />);

    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  it("handles OAuth signup", async () => {
    const user = userEvent.setup();

    vi.mocked(auth.signInWithOAuth).mockResolvedValue(
      {} as ReturnType<typeof auth.signInWithOAuth>,
    );

    await renderWithRouter(<SignupForm />);

    const googleButton = screen.getByRole("button", { name: /sign up with google/i });
    await user.click(googleButton);

    expect(auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
      }),
      expect.any(Object),
    );
  });
});
