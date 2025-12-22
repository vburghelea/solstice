import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicPortalPage } from "~/features/dashboard";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate, user]);

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return <PublicPortalPage />;
}
