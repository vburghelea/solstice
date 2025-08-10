import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import LoginForm from "~/features/auth/components/login";
import { redirectIfAuthenticated } from "~/lib/auth/guards/route-guards";

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ context }) => {
    redirectIfAuthenticated({ user: context.user });
  },
  component: LoginPage,
});

function LoginPage() {
  return <LoginForm />;
}
