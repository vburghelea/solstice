import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getBlocklist, unblockUser } from "~/features/social";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { strings } from "~/shared/lib/strings";
import { UserAvatar } from "~/shared/ui/user-avatar";

export const Route = createFileRoute("/dashboard/profile/blocklist")({
  component: BlocklistPage,
});

function BlocklistPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["blocklist", page, pageSize],
    queryFn: () => getBlocklist({ data: { page, pageSize } }),
    refetchOnMount: "always",
  });

  const rlUnblock = useRateLimitedServerFn(unblockUser, { type: "social" });
  const doUnblock = useMutation({
    mutationFn: async (userId: string) =>
      await rlUnblock({ data: { userId, uiSurface: "blocklist" } }),
    onSuccess: async () => {
      await refetch();
    },
  });

  const items = data?.success ? data.data.items : [];
  const totalCount = data?.success ? data.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {strings.social.blocklist.title}
        </h1>
        <p className="text-muted-foreground mt-2">{strings.social.blocklist.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{strings.social.blocklist.sectionTitle}</CardTitle>
          <CardDescription>
            Users on this list cannot follow, invite, or apply to your games/campaigns,
            and you won’t see their detailed profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">{strings.social.blocklist.empty}</p>
          ) : (
            <ul className="divide-border divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={item.user.name ?? null}
                      email={item.user.email ?? null}
                      srcUploaded={item.user.uploadedAvatarPath ?? null}
                      srcProvider={item.user.image ?? null}
                    />
                    <div>
                      <div className="font-medium">
                        {item.user.name || item.user.email}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Blocked on {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/dashboard/profile/$userId"
                        params={{ userId: item.user.id }}
                      >
                        {strings.social.blocklist.view}
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => doUnblock.mutate(item.user.id)}
                    >
                      {strings.social.blocklist.unblock}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Page {page} of {totalPages} • {totalCount} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {strings.social.blocklist.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {strings.social.blocklist.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
