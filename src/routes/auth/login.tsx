import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAvailableSocialProviders } from "~/features/auth/auth.queries";
import LoginForm from "~/features/auth/components/login";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => ({
    socialProviders: await getAvailableSocialProviders(),
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  const { socialProviders } = Route.useLoaderData() as {
    socialProviders: Awaited<ReturnType<typeof getAvailableSocialProviders>>;
  };

  return <LoginForm redirectPath={redirect} socialProviders={socialProviders} />;
}
