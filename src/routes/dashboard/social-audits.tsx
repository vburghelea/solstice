import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { isAnyAdmin } from "~/features/roles/permission.service";
import { AdminSocialAuditsReport } from "~/features/social/components/admin-social-audits-report";

export const Route = createFileRoute("/dashboard/social-audits")({
  beforeLoad: ({ context }) => {
    const user = context.user;
    if (!user) throw redirect({ to: "/auth/login" });
    if (!isAnyAdmin(user)) throw redirect({ to: "/dashboard" });
  },
  component: SocialAuditsPage,
});

function SocialAuditsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-foreground text-3xl font-bold tracking-tight">Social Audits</h1>
      <p className="text-muted-foreground">
        Admin-only: view recent follow/block actions for moderation.
      </p>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading audits...</div>
          </div>
        }
      >
        <AdminSocialAuditsReport />
      </Suspense>
    </div>
  );
}
