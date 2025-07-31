import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicLayout } from "~/features/layouts/public-layout";
import { redirectIfAuthenticated } from "~/lib/auth/guards/route-guards";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    redirectIfAuthenticated({ user: context.user });
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
