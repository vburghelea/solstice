import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import LoginForm from "~/features/auth/components/login";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search) => searchSchema.parse(search),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();

  return <LoginForm redirectPath={redirect} />;
}
