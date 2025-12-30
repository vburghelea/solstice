import { useMemo, useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "~/lib/security/utils/password-validator";
import { getBrand } from "~/tenant";
import { resetPasswordFormSchema } from "../auth.schemas";

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

type ResetPasswordFormProps = {
  token?: string;
  error?: string;
};

export default function ResetPasswordForm(props: ResetPasswordFormProps) {
  const brand = getBrand();
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const tokenError = props.error || (!props.token ? "INVALID_TOKEN" : null);
  const tokenValue = props.token && !tokenError ? props.token : null;

  const form = useAppForm<ResetPasswordFormValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setErrorMessage("");

      if (!tokenValue) {
        setErrorMessage("Reset link is invalid or expired.");
        return;
      }

      if (value.newPassword !== value.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      const validation = validatePassword(value.newPassword);
      if (!validation.isValid) {
        setErrorMessage(validation.errors[0] ?? "Password does not meet requirements.");
        return;
      }

      try {
        const result = await auth.resetPassword({
          newPassword: value.newPassword,
          token: tokenValue,
        });

        if (result?.error) {
          throw new Error(result.error.message || "Unable to reset password.");
        }

        setIsComplete(true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to reset password. Please try again.",
        );
      }
    },
  });

  const passwordStrength = useMemo(() => {
    const password = form.state.values.newPassword;
    if (!password) return null;
    const score = getPasswordStrength(password);
    return {
      score,
      label: getPasswordStrengthLabel(score),
    };
  }, [form.state.values.newPassword]);

  if (isComplete) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <LogoIcon className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Password updated</h1>
          <p className="text-muted-foreground text-sm">
            Your {brand.name} password has been reset. You can sign in now.
          </p>
        </div>
        <Button asChild>
          <Link to="/auth/login">Continue to login</Link>
        </Button>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <LogoIcon className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Reset link expired</h1>
          <p className="text-muted-foreground text-sm">
            The reset link is invalid or has expired. Request a new link to continue.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth/forgot-password">Request a new link</Link>
        </Button>
        <Link to="/auth/login" className="text-sm underline underline-offset-4">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        data-testid="reset-password-form"
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
            <h1 className="text-xl font-bold">Set a new password</h1>
            <p className="text-muted-foreground text-sm">
              Choose a new password for your {brand.name} account.
            </p>
          </div>

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                try {
                  resetPasswordFormSchema.shape.newPassword.parse(value);
                } catch (error) {
                  if (error instanceof z.ZodError) {
                    return error.issues[0]?.message || "Password is required";
                  }
                  return "Password is required";
                }

                const validation = validatePassword(value);
                if (!validation.isValid) {
                  return validation.errors[0] ?? "Password does not meet requirements";
                }

                return undefined;
              },
            }}
          >
            {(field) => (
              <ValidatedInput
                field={field}
                label="New password"
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
            )}
          </form.Field>

          {passwordStrength ? (
            <div className="text-muted-foreground text-sm">
              Password strength:{" "}
              <span className="font-medium">{passwordStrength.label}</span>
            </div>
          ) : null}

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value }) => {
                try {
                  resetPasswordFormSchema.shape.confirmPassword.parse(value);
                } catch (error) {
                  if (error instanceof z.ZodError) {
                    return error.issues[0]?.message || "Please confirm your password";
                  }
                  return "Please confirm your password";
                }

                if (value && value !== form.state.values.newPassword) {
                  return "Passwords do not match";
                }

                return undefined;
              },
            }}
          >
            {(field) => (
              <ValidatedInput
                field={field}
                label="Confirm password"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            )}
          </form.Field>

          <FormSubmitButton
            isSubmitting={form.state.isSubmitting}
            className="w-full"
            size="lg"
            loadingText="Updating..."
          >
            Reset password
          </FormSubmitButton>

          {errorMessage ? (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          ) : null}
        </div>
      </form>

      <div className="text-center text-sm">
        <Link to="/auth/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </div>
  );
}
