import { useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { auth } from "~/lib/auth-client";
import { getBaseUrl } from "~/lib/env.client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { getBrand } from "~/tenant";
import { forgotPasswordFormSchema } from "../auth.schemas";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordForm() {
  const brand = getBrand();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useAppForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setErrorMessage("");
      setSuccessMessage(null);

      const email = value.email.trim().toLowerCase();
      if (!email) {
        setErrorMessage("Email is required.");
        return;
      }

      try {
        const redirectTo = new URL("/auth/reset-password", getBaseUrl()).toString();
        const result = await auth.requestPasswordReset({ email, redirectTo });

        if (result?.error) {
          throw new Error(result.error.message || "Unable to send reset email.");
        }

        setSuccessMessage(
          "If an account exists for that email, a reset link will arrive shortly.",
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to send reset email. Please try again.",
        );
      }
    },
  });

  if (successMessage) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <LogoIcon className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">{successMessage}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => setSuccessMessage(null)}>
            Send another link
          </Button>
          <Link to="/auth/login" className="text-sm underline underline-offset-4">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        data-testid="forgot-password-form"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <LogoIcon className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground text-sm">
              Enter the email tied to your {brand.name} account and we&apos;ll send a
              reset link.
            </p>
          </div>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                try {
                  forgotPasswordFormSchema.shape.email.parse(value);
                  return undefined;
                } catch (error) {
                  if (error instanceof z.ZodError) {
                    return error.issues[0]?.message || "Invalid email";
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

          <FormSubmitButton
            isSubmitting={form.state.isSubmitting}
            className="w-full"
            size="lg"
            loadingText="Sending..."
          >
            Send reset link
          </FormSubmitButton>

          {errorMessage ? (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          ) : null}
        </div>
      </form>

      <div className="text-center text-sm">
        Remembered your password?{" "}
        <Link to="/auth/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </div>
  );
}
