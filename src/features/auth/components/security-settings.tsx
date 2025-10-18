import { LoaderCircle } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { changePassword } from "~/features/auth/auth.queries";
import { useAuthTranslation } from "~/hooks/useTypedTranslation";
import { useAppForm } from "~/lib/form";

export function SecuritySettings({ embedded = false }: { embedded?: boolean }) {
  const { t } = useAuthTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic schema with translation
  const passwordChangeSchema = z.object({
    currentPassword: z.string().refine((val) => val.length > 0, {
      message: t(
        "security_settings.password_change.validation.current_password_required",
      ),
    }),
    newPassword: z.string().refine((val) => val.length >= 8, {
      message: t("security_settings.password_change.validation.new_password_min_length"),
    }),
  });

  const form = useAppForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },

    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      try {
        //@ts-expect-error: TanStack Start type inference issue
        const result = await changePassword({ data: value });
        if (result.error) {
          throw new Error(result.error);
        }
        setSuccess(t("security_settings.password_change.success"));
      } catch {
        setError(t("security_settings.password_change.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const content = (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="currentPassword"
        validators={{
          onChange: passwordChangeSchema.shape.currentPassword,
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {t("security_settings.password_change.current_password")}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                field.handleChange(event.target.value)
              }
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-destructive text-sm">
                {field.state.meta.errors.join(", ")}
              </p>
            ) : null}
          </div>
        )}
      />
      <form.Field
        name="newPassword"
        validators={{
          onChange: passwordChangeSchema.shape.newPassword,
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {t("security_settings.password_change.new_password")}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                field.handleChange(event.target.value)
              }
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-destructive text-sm">
                {field.state.meta.errors.join(", ")}
              </p>
            ) : null}
          </div>
        )}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            {t("security_settings.password_change.changing_password")}
          </>
        ) : (
          t("security_settings.password_change.button")
        )}
      </Button>
    </form>
  );

  if (embedded) {
    return (
      <section className="space-y-4">
        <h3 className="text-base font-medium">{t("security_settings.title")}</h3>
        {content}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security_settings.title")}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
