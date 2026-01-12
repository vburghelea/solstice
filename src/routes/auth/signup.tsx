import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAvailableSocialProviders } from "~/features/auth/auth.queries";
import SignupForm from "~/features/auth/components/signup";
import { createPageHead } from "~/shared/lib/page-head";

const searchSchema = z.object({
  invite: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => ({
    socialProviders: await getAvailableSocialProviders(),
  }),
  head: () => createPageHead("Sign up"),
  component: SignupRoute,
});

function SignupRoute() {
  const { invite } = Route.useSearch();
  const { socialProviders } = Route.useLoaderData() as {
    socialProviders: Awaited<ReturnType<typeof getAvailableSocialProviders>>;
  };
  if (invite) {
    return <SignupForm inviteToken={invite} socialProviders={socialProviders} />;
  }
  return <SignupForm socialProviders={socialProviders} />;
}
