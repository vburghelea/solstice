import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SafeLink } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { redeemInviteLink } from "~/features/organizations/invite-links/invite-links.mutations";
import { requireAuth } from "~/lib/auth/guards/route-guards";

export const Route = createFileRoute("/join/$token")({
  beforeLoad: ({ context, location, params }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/signup",
        search: { invite: params.token, redirect: location.pathname },
      });
    }
    requireAuth({ user: context.user, location });
  },
  component: JoinLinkPage,
});

function JoinLinkPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const hasRedeemed = useRef(false);

  const { mutate, isError, isPending } = useMutation({
    mutationFn: () => redeemInviteLink({ data: { token } }),
    onSuccess: (result) => {
      const destination =
        result.status === "joined" || result.status === "already_member"
          ? "/dashboard/select-org"
          : "/dashboard/organizations";

      const message =
        result.status === "joined"
          ? "You have been added to the organization."
          : result.status === "pending"
            ? "Your access request is pending approval."
            : result.status === "already_member"
              ? "You already have access to this organization."
              : "You already have a pending request for this organization.";

      toast.success(message);
      navigate({ to: destination });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Invite link failed.");
    },
  });

  useEffect(() => {
    if (hasRedeemed.current) return;
    hasRedeemed.current = true;
    mutate();
  }, [mutate, token]);

  return (
    <div className="container mx-auto max-w-lg space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Joining organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError ? (
            <>
              <p className="text-muted-foreground text-sm">
                We couldn&apos;t process this invite link. It may be expired or revoked.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <SafeLink to="/dashboard/organizations">Browse organizations</SafeLink>
                </Button>
                <Button asChild variant="outline">
                  <SafeLink to="/dashboard/select-org">Select organization</SafeLink>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span>Validating invite link...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
