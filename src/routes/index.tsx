import { createFileRoute, Link } from "@tanstack/react-router";
import { listGames } from "~/features/games/games.queries";
import { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { buttonVariants } from "~/shared/ui/button";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Fetch a limited number of public games for the homepage
    const result = await listGames({
      data: { filters: { visibility: "public", status: "scheduled" } },
    });
    if (result.success) {
      // Limit to 3 featured games
      return { featuredGames: result.data.slice(0, 3) };
    } else {
      console.error("Failed to fetch featured games:", result.errors);
      return { featuredGames: [] };
    }
  },
  component: Index,
});

function Index() {
  const { featuredGames } = Route.useLoaderData(); // Get featuredGames from loader

  return (
    <PublicLayout>
      {" "}
      {/* Wrap with PublicLayout */}
      <div className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-red-700 to-red-900 py-20 text-center text-white md:py-32">
          <div className="container mx-auto px-4">
            <h1 className="font-heading mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Find Your Next Adventure, In Person.
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg sm:text-xl">
              Discover local tabletop and board game events, connect with Game Masters,
              and play in your city.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {/* Location Selector - Placeholder for now */}
              <div className="relative">
                <select
                  className="appearance-none rounded-full bg-white px-6 py-3 pr-10 text-gray-800 shadow-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Your City
                  </option>
                  <option value="new-york">New York City</option>
                  <option value="london">London</option>
                  <option value="berlin">Berlin</option>
                  {/* Add more cities or dynamically load them */}
                </select>
                {/* Arrow icon for dropdown */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {/* Search Button */}
              <Link
                to="/search"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-full",
                )}
              >
                Search Games
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-80">
              (We'll try to infer your city from your GeoIP)
            </p>
          </div>
        </section>

        {/* Featured Games/Events Section */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center text-gray-900">
            <h2 className="font-heading mb-12 text-3xl text-gray-900 md:text-4xl">
              Featured Local Events & Games
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredGames.length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center">
                  No featured games found.
                </p>
              ) : (
                featuredGames.map((game: GameListItem) => (
                  <div
                    key={game.id}
                    className="rounded-lg bg-white p-6 text-left text-gray-900 shadow-md"
                  >
                    <h3 className="mb-2 text-xl font-semibold">{game.name}</h3>
                    <p className="text-muted-foreground mb-4">{game.description}</p>
                    <p className="text-sm text-gray-600">📍 {game.location.address}</p>
                    <p className="text-sm text-gray-600">
                      🗓️ {formatDateAndTime(game.dateTime)}
                    </p>
                    <Link
                      to="/game/$gameId"
                      params={{ gameId: game.id }}
                      className={cn(
                        buttonVariants({ variant: "link" }),
                        "mt-4 p-0 text-red-700",
                      )}
                    >
                      View Details
                    </Link>
                  </div>
                ))
              )}
            </div>
            <Link to="/search" className={cn(buttonVariants({ size: "lg" }), "mt-12")}>
              Browse All Local Games
            </Link>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading mb-12 text-3xl md:text-4xl">How It Works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center p-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Find a Local Game</h3>
                <p className="text-muted-foreground">
                  Search for tabletop RPGs, board game meetups, and events happening near
                  you.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Join a Session</h3>
                <p className="text-muted-foreground">
                  Connect with Game Masters and fellow players. RSVP or book your spot
                  directly.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Play In Person</h3>
                <p className="text-muted-foreground">
                  Enjoy immersive gaming experiences and build a local gaming community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action: Become a Host/GM */}
        <section className="bg-red-800 py-16 text-center text-white md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-heading mb-6 text-3xl md:text-4xl">
              Ready to Host Your Own Game?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
              Share your passion! Become a Game Master or host a board game meetup in your
              area.
            </p>
            <Link
              to="/auth/signup"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "rounded-full",
              )}
            >
              Become a Host
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
