import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PublicLayout } from "~/features/layouts/public-layout";

export const Route = createFileRoute("/(auth)")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const REDIRECT_URL = "/dashboard";
    if (context.user) {
      throw redirect({
        to: REDIRECT_URL,
      });
    }
    return {
      redirectUrl: REDIRECT_URL,
    };
  },
});

function RouteComponent() {
  return (
    <PublicLayout>
      <div className="bg-background flex min-h-[calc(100vh-theme(space.32))] flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </PublicLayout>
  );
}
