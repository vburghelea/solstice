import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getBlocklist, unblockUser } from "~/features/social";
import { UserAvatar } from "~/shared/ui/user-avatar";

export const Route = createFileRoute("/dashboard/profile/blocklist")({
  component: BlocklistPage,
});

function BlocklistPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["blocklist"],
    queryFn: () => getBlocklist({ data: { page: 1, pageSize: 50 } }),
    refetchOnMount: "always",
  });

  const doUnblock = useMutation({
    mutationFn: async (userId: string) => await unblockUser({ data: { userId } }),
    onSuccess: async () => {
      await refetch();
    },
  });

  const items = data?.success ? data.data.items : [];

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Blocklist</h1>
        <p className="text-muted-foreground mt-2">
          Manage users you’ve blocked from interacting with you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
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
            <p className="text-muted-foreground">Your blocklist is empty.</p>
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
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => doUnblock.mutate(item.user.id)}
                    >
                      Unblock
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
