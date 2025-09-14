import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { ProfileLink } from "~/components/ProfileLink";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GMReviewForm } from "~/features/games/components/GMReviewForm";
import { listPendingGMReviews } from "~/features/reviews/reviews.queries";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { ThumbsScore } from "~/shared/ui/thumbs-score";
import { UserAvatar } from "~/shared/ui/user-avatar";

export const Route = createFileRoute("/dashboard/reviews/pending")({
  component: PendingReviewsPage,
});

function PendingReviewsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pendingGMReviews"],
    queryFn: async () => listPendingGMReviews({}),
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">Loading pending reviews...</span>
      </div>
    );
  }
  if (error || !data?.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load pending reviews</p>
      </div>
    );
  }

  const items = data.data || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Pending GM Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.length === 0 ? (
            <p className="text-muted-foreground">No pending reviews. Nice!</p>
          ) : (
            items.map((item, idx) => (
              <details
                key={item.gameId}
                className="bg-card rounded-lg border open:shadow-sm"
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="cursor-pointer px-4 py-3 font-medium select-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        <Link
                          to="/dashboard/games/$gameId"
                          params={{ gameId: item.gameId }}
                        >
                          {item.gameName}
                        </Link>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {formatDateAndTime(item.dateTime)}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <UserAvatar
                          name={item.gm.name}
                          email={item.gm.email}
                          srcUploaded={item.gm.uploadedAvatarPath ?? null}
                          srcProvider={item.gm.image ?? null}
                          className="h-6 w-6"
                        />
                        <ProfileLink
                          userId={item.gm.id}
                          username={item.gm.name || item.gm.email || "Unknown"}
                        />
                        <span className="text-muted-foreground">•</span>
                        <ThumbsScore value={item.gm.gmRating ?? null} />
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">Review</div>
                  </div>
                </summary>
                <div className="px-4 pt-2 pb-4">
                  <GMReviewForm
                    gameId={item.gameId}
                    gmId={item.gm.id}
                    onSubmitted={() => {
                      // Optimistically remove this item from the cache list
                      queryClient.setQueryData(["pendingGMReviews"], (prev: unknown) => {
                        const value = prev as
                          | { success: boolean; data?: typeof items }
                          | undefined;
                        if (!value || !value.success || !value.data) return prev;
                        return {
                          success: true,
                          data: value.data.filter((x) => x.gameId !== item.gameId),
                        };
                      });
                      // Also refresh the dashboard count when visible
                      queryClient.invalidateQueries({
                        queryKey: ["pending-gm-reviews-count"],
                      });
                    }}
                  />
                </div>
              </details>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
