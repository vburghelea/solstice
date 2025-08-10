import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { GoogleIcon, LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { loginFormSchema } from "../auth.schemas";

export default function LoginForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  // Get redirect parameter from URL, default to dashboard
  const redirectUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
      : "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await auth.signIn.email(value);

        if (result?.error) {
          throw new Error(result.error.message || "Invalid email or password");
        }

        // Success path
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await router.invalidate();
        await navigate({ to: redirectUrl });
      } catch (error) {
        // Error handling
        setErrorMessage((error as Error)?.message || "Invalid email or password");
        // Keep form values but reset submitting state by resetting with current values
        form.reset(value);
      } finally {
        // Always reset loading state
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <LogoIcon className="size-6" />
              </div>
              <span className="sr-only">Roundup Games</span>
            </a>
            <h1 className="text-xl font-bold">Welcome back to Roundup Games</h1>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  try {
                    loginFormSchema.shape.email.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.errors?.[0]?.message || "Invalid email";
                    }
                    return "Invalid email";
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Email"
                  type="email"
                  placeholder="hello@example.com"
                  autoComplete="email"
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  try {
                    loginFormSchema.shape.password.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.errors?.[0]?.message || "Password is required";
                    }
                    return "Password is required";
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Password"
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting || isLoading}
              className="mt-2 w-full"
              size="lg"
              loadingText="Logging in..."
            >
              Login
            </FormSubmitButton>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={isLoading || form.state.isSubmitting}
            onClick={() =>
              auth.signInWithOAuth(
                {
                  provider: "google",
                  callbackURL: redirectUrl,
                },
                {
                  onRequest: () => {
                    setIsLoading(true);
                    setErrorMessage("");
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onError: (ctx: any) => {
                    setIsLoading(false);
                    setErrorMessage(ctx.error?.message || "OAuth login failed");
                  },
                },
              )
            }
          >
            <GoogleIcon />
            Login with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={isLoading || form.state.isSubmitting}
            onClick={() =>
              auth.signInWithOAuth(
                {
                  provider: "discord",
                  callbackURL: redirectUrl,
                },
                {
                  onRequest: () => {
                    setIsLoading(true);
                    setErrorMessage("");
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onError: (ctx: any) => {
                    setIsLoading(false);
                    setErrorMessage(ctx.error?.message || "OAuth login failed");
                  },
                },
              )
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-discord mr-2 h-4 w-4"
            >
              <path d="M10.5 11.5c-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0 .98-.98.98-2.52 0-3.5Z" />
              <path d="M17 11.5c-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0 .98-.98.98-2.52 0-3.5Z" />
              <path d="M8 17.5s1.5 2 4 2 4-2 4-2" />
              <path d="M19.5 10c.98-.98.98-2.52 0-3.5-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0Z" />
              <path d="M4.5 10c.98-.98.98-2.52 0-3.5-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0Z" />
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
            </svg>
            Login with Discord
          </Button>
        </div>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/auth/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}
