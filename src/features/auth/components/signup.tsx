import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { GoogleIcon, LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { checkProfileNameAvailability } from "~/features/profile/profile.queries";
import {
  sanitizeProfileName,
  validateProfileNameValue,
} from "~/features/profile/profile.utils";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { signupFormFields } from "../auth.schemas";

export default function SignupForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const redirectUrl = "/player"; // Default redirect after signup

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
        const sanitizedInput = sanitizeProfileName(value.name ?? "");
        const nameValidation = validateProfileNameValue(value.name ?? "");

        const setNameError = (message: string) => {
          setErrorMessage(message);
          form.setFieldMeta("name", (prev) => ({
            ...(prev ?? {}),
            errors: message ? [message] : [],
            isTouched: true,
            isBlurred: true,
          }));
        };

        if (!sanitizedInput || !nameValidation.success) {
          const message = nameValidation.success
            ? "Profile name must contain allowed characters"
            : nameValidation.error;
          setNameError(message);
          form.setFieldValue("name", sanitizedInput);
          setIsLoading(false);
          return;
        }

        const sanitizedName = nameValidation.value;
        if (sanitizedName !== form.state.values.name) {
          form.setFieldValue("name", sanitizedName);
        }

        const availabilityResult = await checkProfileNameAvailability({
          data: { name: sanitizedName },
        });

        if (!availabilityResult.success) {
          const message =
            availabilityResult.errors?.[0]?.message ||
            "Unable to verify profile name. Please try again.";
          setNameError(message);
          form.setFieldValue("name", sanitizedName);
          setIsLoading(false);
          return;
        }

        if (!availabilityResult.data.available) {
          setNameError("That profile name is already taken");
          form.setFieldValue("name", sanitizedName);
          setIsLoading(false);
          return;
        }

        form.setFieldValue("name", sanitizedName);
        form.setFieldMeta("name", (prev) => ({
          ...(prev ?? {}),
          errors: [],
          isTouched: true,
          isBlurred: true,
        }));

        const result = await auth.signUp.email({
          name: sanitizedName,
          email: value.email,
          password: value.password,
          callbackURL: redirectUrl,
        });

        if (result?.error) {
          throw new Error(result.error.message || "Signup failed");
        }

        // Success path
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await router.invalidate();
        await navigate({ to: redirectUrl });
      } catch (error) {
        // Error handling
        setErrorMessage((error as Error)?.message || "Signup failed");
        // Keep form values but reset submitting state by resetting with current values
        form.reset({
          name: form.state.values.name,
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
              <span className="sr-only">Roundup Games</span>
            </a>
            <h1 className="text-xl font-bold">Sign up for Roundup Games</h1>
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
                    setErrorMessage(ctx.error?.message || "OAuth signup failed");
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
            Sign up with Discord
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
