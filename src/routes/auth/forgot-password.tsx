import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { LogoIcon } from "~/components/ui/icons";
import { requestPasswordReset } from "~/features/auth/auth.mutations";
import { useAuthTranslation } from "~/hooks/useTypedTranslation";
import { useAppForm } from "~/lib/hooks/useAppForm";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordForm,
});

function ForgotPasswordForm() {
  const { t } = useAuthTranslation();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await requestPasswordReset({ data: value });
        if (result.success) {
          toast.success(t("forgot_password.success.toast"));
          setIsSuccess(true);
        } else {
          throw new Error(result.errors?.[0]?.message || "Failed to send reset link.");
        }
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-xl font-bold">{t("forgot_password.success.title")}</h1>
        <p className="text-muted-foreground">{t("forgot_password.success.message")}</p>
        <Link to="/auth/login" className="text-sm underline underline-offset-4">
          {t("forgot_password.actions.back_to_login")}
        </Link>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">{t("forgot_password.title")}</h1>
            <p className="text-muted-foreground text-center text-sm">
              {t("forgot_password.no_problem")}
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field name="email">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label={t("forgot_password.fields.email")}
                  type="email"
                  placeholder={t("forgot_password.fields.placeholder")}
                  autoFocus
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting}
              className="w-full"
              size="lg"
              loadingText={t("forgot_password.loading")}
            >
              {t("forgot_password.button")}
            </FormSubmitButton>
          </div>
        </div>
      </form>
      <div className="text-center text-sm">
        {t("forgot_password.actions.remembered_password")}{" "}
        <Link to="/auth/login" className="underline underline-offset-4">
          {t("forgot_password.actions.back_to_login")}
        </Link>
      </div>
    </div>
  );
}
