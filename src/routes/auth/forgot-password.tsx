import { createFileRoute } from "@tanstack/react-router";
import ForgotPasswordForm from "~/features/auth/components/forgot-password";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => createPageHead("Forgot password"),
  component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
  return <ForgotPasswordForm />;
}
