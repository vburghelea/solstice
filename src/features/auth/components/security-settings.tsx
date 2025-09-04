import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { changePassword } from "~/features/auth/auth.queries";
import { useAppForm } from "~/lib/form";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export function SecuritySettings({ embedded = false }: { embedded?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setSuccess("Password updated successfully!");
      } catch {
        setError("Failed to update password. Please check your current password.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const content = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
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
            <Label htmlFor={field.name}>Current Password</Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
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
            <Label htmlFor={field.name}>New Password</Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
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
            Changing Password...
          </>
        ) : (
          "Change Password"
        )}
      </Button>
    </form>
  );

  if (embedded) {
    return (
      <section className="space-y-4">
        <h3 className="text-base font-medium">Security Settings</h3>
        {content}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
