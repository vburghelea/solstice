import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { GoogleIcon, LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { getBrand } from "~/tenant";
import { authQueryKey } from "../auth.queries";
import { signupFormFields } from "../auth.schemas";

export default function SignupForm() {
  const brand = getBrand();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const redirectUrl = "/dashboard"; // Default redirect after signup

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await auth.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: redirectUrl,
        });

        if (result?.error) {
          throw new Error(result.error.message || "Signup failed");
        }

        // Success path
        await queryClient.invalidateQueries({ queryKey: authQueryKey });
        await router.invalidate();
        await navigate({ to: redirectUrl });
      } catch (error) {
        // Error handling
        setErrorMessage((error as Error)?.message || "Signup failed");
        // Keep form values but reset submitting state by resetting with current values
        form.reset({
          name: value.name,
          email: value.email,
          password: value.password,
          confirmPassword: value.confirmPassword,
        });
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
              <span className="sr-only">{brand.name}</span>
            </a>
            <h1 className="text-xl font-bold">Sign up for {brand.name}</h1>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field
              name="name"
              validators={{
                onChange: signupFormFields.name,
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field
              name="email"
              validators={{
                onChange: signupFormFields.email,
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Email"
                  type="email"
                  placeholder="hello@example.com"
                  autoComplete="email"
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: signupFormFields.password,
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Password"
                  type="password"
                  placeholder="Password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onChange: ({ value, fieldApi }) => {
                  const password = fieldApi.form.getFieldValue("password");
                  // Only validate if both fields have values
                  if (value && password && value !== password) {
                    return "Passwords do not match";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting || isLoading}
              className="mt-2 w-full"
              size="lg"
              loadingText="Signing up..."
            >
              Sign up
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
                    setErrorMessage(ctx.error?.message || "OAuth signup failed");
                  },
                },
              )
            }
          >
            <GoogleIcon />
            Sign up with Google
          </Button>
        </div>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/auth/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
}
