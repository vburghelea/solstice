import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import ResetPasswordForm from "~/features/auth/components/reset-password";

const searchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token, error } = Route.useSearch();
  return (
    <ResetPasswordForm {...(token ? { token } : {})} {...(error ? { error } : {})} />
  );
}
