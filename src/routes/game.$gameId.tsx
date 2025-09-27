import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { useAuth } from "~/features/auth/hooks/useAuth";
import { applyToGame } from "~/features/games/games.mutations";
import { getGame } from "~/features/games/games.queries";
import type { GameApplication, GameWithDetails } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { formatDateAndTime } from "~/shared/lib/datetime";
import type { OperationResult } from "~/shared/types/common";

export const Route = createFileRoute("/game/$gameId")({
  loader: async ({ params }) => {
    const result: OperationResult<GameWithDetails | null> = await getGame({
      data: { id: params.gameId },
    });
    if (result.success && result.data) {
      // Public route must only show scheduled, public games
      if (result.data.visibility === "public" && result.data.status === "scheduled") {
        return { gameDetails: result.data };
      }
      return { gameDetails: null };
    } else {
      console.error(
        "Failed to fetch game details:",
        result.success ? "Unknown error" : result.errors,
      );
      // Handle case where game is not found, e.g., redirect or show error
      return { gameDetails: null };
    }
  },
  component: GameDetailPage,
});

function GameDetailPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { gameDetails } = Route.useLoaderData();

  const applyMutation = useMutation<
    OperationResult<GameApplication>,
    Error,
    { data: { gameId: string; message?: string } }
  >({
    mutationFn: (variables) => applyToGame(variables),
    onSuccess: (res) => {
      if (res.success) {
        console.info("Application submitted");
      }
    },
  });

  if (!gameDetails) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading mb-8 text-4xl">Game Not Found</h1>
          <p className="text-muted-foreground">
            The game you are looking for does not exist or has been removed.
          </p>
        </div>
      </PublicLayout>
    );
  }

  // Compute CTA state
  const isOwner = gameDetails.owner?.id && user?.id === gameDetails.owner.id;
  const isOpenForApplications = gameDetails.status === "scheduled";
  const canApply =
    isOpenForApplications && !isOwner && gameDetails.visibility === "public";

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 pb-28 lg:pb-16">
        {/* Header: distinct title + meta */}
        <div className="mb-6">
          <h1 className="font-heading text-center text-3xl md:text-left md:text-4xl">
            {gameDetails.name}
          </h1>
          <p className="text-muted-foreground mt-2 text-center md:text-left">
            🗓️ {formatDateAndTime(gameDetails.dateTime)} • 📍{" "}
            {gameDetails.location.address} • 🎲 {gameDetails.gameSystem?.name || "N/A"}
          </p>
        </div>

        {/* Description card */}
        {gameDetails.description ? (
          <div className="bg-card text-foreground mb-4 rounded-lg p-4 shadow-sm">
            <p className="text-base leading-relaxed">{gameDetails.description}</p>
          </div>
        ) : null}

        {/* Collapsible sections */}
        <div className="space-y-3">
          <details
            id="general"
            className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
            open
          >
            <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
              General
            </summary>
            <div className="text-foreground grid gap-4 px-4 pt-2 pb-4 md:grid-cols-2">
              <div>
                <p className="font-semibold">Date & Time</p>
                <p>{formatDateAndTime(gameDetails.dateTime)}</p>
              </div>
              <div>
                <p className="font-semibold">Game System</p>
                <p>{gameDetails.gameSystem?.name || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold">Game Master</p>
                <p>{gameDetails.owner?.name || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold">Language</p>
                <p>{gameDetails.language}</p>
              </div>
              <div>
                <p className="font-semibold">Visibility</p>
                <p className="capitalize">{gameDetails.visibility}</p>
              </div>
              <div>
                <p className="font-semibold">Price</p>
                <p>{gameDetails.price ? `€${gameDetails.price}` : "Free"}</p>
              </div>
            </div>
          </details>

          <details
            id="location"
            className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
          >
            <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
              Location
            </summary>
            <div className="text-foreground px-4 pt-2 pb-4">
              <p>{gameDetails.location.address}</p>
            </div>
          </details>

          <details
            id="requirements"
            className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
          >
            <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
              Minimum Requirements
            </summary>
            <div className="text-foreground grid gap-4 px-4 pt-2 pb-4">
              <div>
                <p className="font-semibold">Players</p>
                <p>
                  {gameDetails.minimumRequirements?.minPlayers ?? "?"} -{" "}
                  {gameDetails.minimumRequirements?.maxPlayers ?? "?"}
                </p>
              </div>
            </div>
          </details>

          <details
            id="safety"
            className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
          >
            <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
              Safety Rules
            </summary>
            <div className="text-foreground px-4 pt-2 pb-4">
              <SafetyRulesView safetyRules={gameDetails.safetyRules} />
            </div>
          </details>
        </div>

        {/* Sticky CTA for mobile */}
        {canApply ? (
          <StickyActionBar>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="text-sm">
                {gameDetails.price ? `Price: €${gameDetails.price}` : "Free"}
                {gameDetails.minimumRequirements?.minPlayers &&
                gameDetails.minimumRequirements?.maxPlayers
                  ? ` • Players ${gameDetails.minimumRequirements.minPlayers}-${gameDetails.minimumRequirements.maxPlayers}`
                  : ""}
              </div>
              {isAuthenticated ? (
                <Button
                  onClick={() =>
                    applyMutation.mutate({ data: { gameId: gameDetails.id } })
                  }
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? "Applying..." : "Apply to Join"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    navigate({
                      to: "/auth/login",
                      search: { redirect: `/game/${gameDetails.id}` },
                    })
                  }
                >
                  Sign in to Apply
                </Button>
              )}
            </div>
          </StickyActionBar>
        ) : null}
      </div>
    </PublicLayout>
  );
}
