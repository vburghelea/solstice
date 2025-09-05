import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { useAuth } from "~/features/auth/hooks/useAuth";
import { applyToGame } from "~/features/games/games.mutations";
import { getGame } from "~/features/games/games.queries";
import { PublicLayout } from "~/features/layouts/public-layout";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { Button } from "~/shared/ui/button";

export const Route = createFileRoute("/game/$gameId")({
  loader: async ({ params }) => {
    const result = await getGame({ data: { id: params.gameId } });
    if (result.success && result.data) {
      if (result.data.visibility === "public") {
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

  // Define hooks before any early returns to satisfy lint rules
  const applyMutation = useMutation({
    mutationFn: applyToGame,
    onSuccess: (res) => {
      if (res.success) {
        // Navigate to a lightweight confirmation (or stay)
        // For now, just toast via console; UI uses StickyActionBar state
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
            🗓️ {new Date(gameDetails.dateTime).toLocaleString()} • 📍{" "}
            {gameDetails.location.address} • 🎲 {gameDetails.gameSystem?.name || "N/A"}
          </p>
        </div>

        {/* Mobile anchor nav for sections */}
        <nav aria-label="Sections" className="mb-4 overflow-x-auto">
          <ul className="flex gap-3 text-sm">
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#general"
              >
                General
              </a>
            </li>
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#location"
              >
                Location
              </a>
            </li>
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#requirements"
              >
                Requirements
              </a>
            </li>
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#safety"
              >
                Safety
              </a>
            </li>
          </ul>
        </nav>

        {/* Description card */}
        {gameDetails.description ? (
          <div className="mb-4 rounded-lg bg-white p-4 text-gray-800 shadow-sm">
            <p className="text-base leading-relaxed">{gameDetails.description}</p>
          </div>
        ) : null}

        {/* Collapsible sections */}
        <div className="space-y-3">
          <details
            id="general"
            className="scroll-mt-24 rounded-lg border bg-white open:shadow-sm"
            open
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900 select-none">
              General
            </summary>
            <div className="grid gap-4 px-4 pt-2 pb-4 text-gray-900 md:grid-cols-2">
              <div>
                <p className="font-semibold">Date & Time</p>
                <p>{new Date(gameDetails.dateTime).toLocaleString()}</p>
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
            className="scroll-mt-24 rounded-lg border bg-white open:shadow-sm"
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900 select-none">
              Location
            </summary>
            <div className="px-4 pt-2 pb-4 text-gray-900">
              <p>{gameDetails.location.address}</p>
            </div>
          </details>

          <details
            id="requirements"
            className="scroll-mt-24 rounded-lg border bg-white open:shadow-sm"
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900 select-none">
              Minimum Requirements
            </summary>
            <div className="grid gap-4 px-4 pt-2 pb-4 text-gray-900 md:grid-cols-2">
              <div>
                <p className="font-semibold">Players</p>
                <p>
                  {gameDetails.minimumRequirements?.minPlayers ?? "?"} -{" "}
                  {gameDetails.minimumRequirements?.maxPlayers ?? "?"}
                </p>
              </div>
              <div>
                <p className="font-semibold">Language Level</p>
                <p>{gameDetails.minimumRequirements?.languageLevel || "N/A"}</p>
              </div>
            </div>
          </details>

          <details
            id="safety"
            className="scroll-mt-24 rounded-lg border bg-white open:shadow-sm"
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900 select-none">
              Safety Rules
            </summary>
            <div className="px-4 pt-2 pb-4 text-gray-900">
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
