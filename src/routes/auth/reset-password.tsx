import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { LogoIcon } from "~/components/ui/icons";
import { resetPassword } from "~/features/auth/auth.mutations";
import { useAuthTranslation } from "~/hooks/useTypedTranslation";
import { useAppForm } from "~/lib/hooks/useAppForm";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordForm,
  validateSearch: (search: { token?: string }) => search,
});

function ResetPasswordForm() {
  const { t } = useAuthTranslation();
  const navigate = useNavigate();
  const { token = null } = Route.useSearch();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error(t("password_reset.no_token"));
      navigate({ to: "/auth/forgot-password" });
    }
  }, [token, navigate, t]);

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
          toast.success(t("password_reset.success"));
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
            <h1 className="text-xl font-bold">{t("password_reset.title")}</h1>
            <p className="text-muted-foreground text-center text-sm">
              {t("password_reset.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field name="password">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label={t("password_reset.fields.new_password")}
                  type="password"
                  placeholder={t("password_reset.fields.new_password_placeholder")}
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label={t("password_reset.fields.confirm_password")}
                  type="password"
                  placeholder={t("password_reset.fields.confirm_password_placeholder")}
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting}
              className="w-full"
              size="lg"
              loadingText={t("password_reset.loading")}
            >
              {t("password_reset.button")}
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
