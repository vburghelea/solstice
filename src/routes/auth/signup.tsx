import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import SignupForm from "~/features/auth/components/signup";

const searchSchema = z.object({
  invite: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search) => searchSchema.parse(search),
  component: SignupRoute,
});

function SignupRoute() {
  const { invite } = Route.useSearch();
  if (invite) {
    return <SignupForm inviteToken={invite} />;
  }
  return <SignupForm />;
}
