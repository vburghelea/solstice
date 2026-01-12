import { createFileRoute, Outlet } from "@tanstack/react-router";
import { redirectIfAuthenticated } from "~/lib/auth/guards/route-guards";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    redirectIfAuthenticated({ user: context.user });
  },
  head: () => createPageHead("Authentication"),
});

function RouteComponent() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10"
      >
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
