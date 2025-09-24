import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { LogoIcon } from "~/components/ui/icons";
import { resetPassword } from "~/features/auth/auth.mutations";
import { useAppForm } from "~/lib/hooks/useAppForm";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordForm,
  validateSearch: (search: { token?: string }) => search,
});

function ResetPasswordForm() {
  const navigate = useNavigate();
  const { token = null } = Route.useSearch();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("No reset token found. Please request a new reset link.");
      navigate({ to: "/auth/forgot-password" });
    }
  }, [token, navigate]);

  const form = useAppForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) return;
      try {
        const result = await resetPassword({
          data: { ...value, token: token as string },
        });
        if (result.success) {
          toast.success("Password reset successfully! You can now log in.");
          navigate({ to: "/auth/login" });
        } else {
          throw new Error(result.errors?.[0]?.message || "Failed to reset password.");
        }
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
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
            <h1 className="text-xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground text-center text-sm">
              Enter your new password below.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field name="password">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting}
              className="w-full"
              size="lg"
              loadingText="Resetting..."
            >
              Reset Password
            </FormSubmitButton>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
        </div>
      </form>
    </div>
  );
}
