import { createFileRoute } from "@tanstack/react-router";
import SignupForm from "~/features/auth/components/signup";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignupForm,
});
