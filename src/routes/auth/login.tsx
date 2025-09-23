import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import LoginForm from "~/features/auth/components/login";
import { redirectIfAuthenticated } from "~/lib/auth/guards/route-guards";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    redirectIfAuthenticated({ user: context.user });
  },
  component: LoginPage,
});

function LoginPage() {
  return <LoginForm />;
}
