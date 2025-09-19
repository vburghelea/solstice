import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPopularSystems } from "~/features/game-systems/game-systems.queries";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import { GameListItemView } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import { GameListItem } from "~/features/games/games.types";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "~/components/ui/button";
import { DataErrorState } from "~/components/ui/data-state";
import { EventCard, EventCardSkeleton } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { listPopularSystems } from "~/features/game-systems/game-systems.queries";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import { GameListItemView } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { buttonVariants } from "~/shared/ui/button";
import { List } from "~/shared/ui/list";

type HomeLoaderData = {
  featuredGames: GameListItem[];
  popularSystems: PopularGameSystem[];
};

const UPCOMING_EVENTS_LIMIT = 6;

export const Route = createFileRoute("/")({
  loader: async (): Promise<HomeLoaderData> => {
    const [gamesResult, popularSystemsResult] = await Promise.all([
      listGames({ data: { filters: { visibility: "public", status: "scheduled" } } }),
      listPopularSystems().catch((error) => {
        console.error("Failed to fetch popular systems:", error);
        return [] as PopularGameSystem[];
      }),
    ]);

    if (gamesResult.success) {
      return {
        featuredGames: gamesResult.data.slice(0, 3),
        popularSystems: popularSystemsResult,
      };
    }

    console.error("Failed to fetch featured games:", gamesResult.errors);
    return { featuredGames: [], popularSystems: popularSystemsResult };
  },
  component: Index,
});

function Index() {
  const { featuredGames, popularSystems } = Route.useLoaderData() as HomeLoaderData;
  const { events: initialEvents } = Route.useLoaderData() as {
    events: EventWithDetails[];
  };

  const {
    data: events = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["upcoming-events", { limit: UPCOMING_EVENTS_LIMIT }],
    queryFn: async () =>
      (await getUpcomingEvents({
        data: { limit: UPCOMING_EVENTS_LIMIT },
      })) as EventWithDetails[],
    initialData: initialEvents,
    staleTime: 1000 * 60,
  });

  const isLoading = (isPending || isFetching) && events.length === 0;
  const skeletonKeys = ["home-a", "home-b", "home-c"];

  const highlights = [
    { label: "Registered Members", value: "200+" },
    { label: "Active Clubs Nationwide", value: "10+" },
    { label: "Cities WithYouth Programs", value: "5+" },
  ];

  const pillars = [
    {
      title: "National Competitions",
      description:
        "From regional qualifiers to the Canadian Cup, we deliver a schedule that challenges elite athletes and welcomes new competitors alike.",
      icon: Trophy,
    },
    {
      title: "Club Development",
      description:
        "We provide toolkits, grants, and mentorship so every program—from university clubs to community leagues—can thrive year-round.",
      icon: UsersIcon,
    },
    {
      title: "Safe & Inclusive Play",
      description:
        "Certified officials, safeguarding training, and rule adaptations ensure Quadball is accessible for athletes of every identity and ability.",
      icon: ShieldCheck,
    },
  ];

  return (
    <PublicLayout>
      <HeroSection
        title="Welcome to Roundup Games"
        subtitle="A platform for connecting tabletop and board game enthusiasts, helping them organize game sessions, longer running campaigns, events, and administrative tasks."
        backgroundImage="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1893"
        ctaText="Explore Games"
        ctaLink="/"
      />

      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <EventCard
              title="National Championship"
              description="Join us for the biggest event of the year!"
              image="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1740"
              link="/"
            />
            <EventCard
              title="Regional Training Camp"
              description="Improve your skills with top coaches in the region."
              image="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1740"
              link="/"
            />
            <EventCard
              title="Community Meetup"
              description="Connect with fellow enthusiasts in your area."
              image="https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1674"
              link="/"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                Upcoming Competitions
              </p>
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <label className="sr-only" htmlFor="home-city">
                  Select your city
                </label>
                <div className="relative w-full max-w-xs sm:max-w-sm">
                  <select
                    id="home-city"
                    className="border-border bg-card/80 focus:border-primary focus:ring-primary/30 w-full appearance-none rounded-full border px-5 py-3 pr-10 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select your city
                    </option>
                    <option value="new-york">New York City</option>
                    <option value="london">London</option>
                    <option value="berlin">Berlin</option>
                  </select>
                  <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg
                      aria-hidden
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95 10 13.657 15.657 8 14.243 6.586 10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                <Link
                  to="/search"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full rounded-full px-8 sm:w-auto",
                  )}
                >
                  Search games
                </Link>
              </div>
              <p className="text-muted-foreground/80 text-xs">
                We’ll do our best to infer your city from your location.
              </p>
            </div>
          </div>
        </section>

        <section className="border-border/60 bg-muted/40 border-y py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <h2 className="font-heading text-3xl md:text-4xl">
                Featured local events & games
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Hand-picked sessions from community hosts happening soon in your city.
              </p>
            </div>
            {featuredGames.length === 0 ? (
              <div className="border-border/70 bg-card/50 mt-12 flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center">
                <p className="text-muted-foreground text-base font-medium">
                  No featured games yet.
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  Check back shortly or explore the full listing to find a group that
                  fits.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-12 md:hidden">
                  <List>
                    {featuredGames.map((game: GameListItem) => (
                      <GameListItemView key={game.id} game={game} />
                    ))}
                  </List>
                </div>

                <div className="mt-12 hidden grid-cols-1 gap-8 md:grid md:grid-cols-2 lg:grid-cols-3">
                  {featuredGames.map((game: GameListItem) => (
                    <article
                      key={game.id}
                      className="border-border/70 bg-card/80 hover:border-primary/50 flex h-full flex-col justify-between gap-4 rounded-3xl border p-6 text-left shadow-sm transition"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">{game.name}</h3>
                        {game.description ? (
                          <p className="text-muted-foreground line-clamp-3 text-sm">
                            {game.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground space-y-2 text-sm">
                        <p className="flex items-start gap-2">
                          <span aria-hidden>📍</span>
                          <span className="flex-1">{game.location.address}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span aria-hidden>🗓️</span>
                          <span className="flex-1">
                            {formatDateAndTime(game.dateTime)}
                          </span>
                        </p>
                      </div>
                      <Link
                        to="/game/$gameId"
                        params={{ gameId: game.id }}
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "mt-2 self-start rounded-full",
                        )}
                      >
                        View details
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}
            <div className="mt-12 flex justify-center">
              <Link
                to="/search"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
              >
                Browse all local games
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h2 className="font-heading text-3xl sm:text-4xl">
                  Popular game systems
                </h2>
                <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
                  Sessions most frequently booked by the community over the past few
                  weeks.
                </p>
              </div>
              <Link
                to="/systems"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "self-start rounded-full px-5",
                )}
              >
                Browse all systems
              </Link>
            </div>

            {popularSystems.length === 0 ? (
              <p className="text-muted-foreground/80 mt-10 text-center text-sm">
                We’ll highlight popular systems once more sessions are scheduled.
              </p>
            ) : (
              <div className="mt-10 overflow-x-auto pb-4">
                <div className="flex gap-6 pb-2">
                  {popularSystems.map((system) => (
                    <Link
                      key={system.id}
                      to="/systems/$slug"
                      params={{ slug: system.slug }}
                      className="focus-visible:ring-offset-background group border-border/70 bg-card/80 hover:border-primary/50 hover:bg-card/90 w-64 flex-shrink-0 rounded-3xl border px-3 pt-3 pb-4 shadow-sm transition sm:w-72 sm:px-4 sm:pt-4 sm:pb-5"
                    >
                      <div className="bg-muted h-40 w-full overflow-hidden rounded-2xl">
                        {system.heroUrl ? (
                          <img
                            src={system.heroUrl}
                            alt={`${system.name} cover art`}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full w-full items-center justify-center px-4 text-center text-sm">
                            Hero art pending moderation
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold">{system.name}</h3>
                          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            {system.gameCount} sessions
                          </span>
                        </div>
                        {system.summary ? (
                          <p className="text-muted-foreground/90 line-clamp-3 text-sm">
                            {system.summary}
                          </p>
                        ) : (
                          <p className="text-muted-foreground/70 text-sm">
                            Description coming soon.
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border-border/60 bg-muted/30 border-t py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading mb-12 text-3xl md:text-4xl">How it works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {["Find a local game", "Join a session", "Play in person"].map(
                (title, index) => {
                  const descriptions = [
                    "Search for tabletop RPGs, board game meetups, and events happening near you.",
                    "Connect with Game Masters and fellow players. RSVP or book your spot directly.",
                    "Enjoy immersive gaming experiences and build a local gaming community.",
                  ];

                  return (
                    <div
                      key={title}
                      className="border-border/60 bg-card/60 flex flex-col items-center rounded-3xl border p-6 text-center shadow-sm"
                    >
                      <div className="bg-primary/15 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                        {index + 1}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {descriptions[index]}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden py-16 text-center sm:py-20">
          <div className="from-primary/80 via-primary to-primary/80 absolute inset-0 -z-10 bg-gradient-to-r" />
          <div className="container mx-auto px-4">
            <div className="text-primary-foreground mx-auto max-w-2xl space-y-6">
              <h2 className="font-heading text-3xl md:text-4xl">
                Ready to host your own game?
              </h2>
              <p className="text-lg sm:text-xl">
                Share your passion! Become a Game Master or host a board game meetup in
                your area.
              </p>
              <Link
                to="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-full px-8",
                )}
              >
                Become a host
              </Link>
            </div>
          </div>
        </section>

        <section className="border-border/60 bg-muted/40 border-y py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <h2 className="font-heading text-3xl md:text-4xl">
                Featured local events & games
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Hand-picked sessions from community hosts happening soon in your city.
              </p>
            </div>
            {featuredGames.length === 0 ? (
              <div className="border-border/70 bg-card/50 mt-12 flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center">
                <p className="text-muted-foreground text-base font-medium">
                  No featured games yet.
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  Check back shortly or explore the full listing to find a group that
                  fits.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-12 md:hidden">
                  <List>
                    {featuredGames.map((game: GameListItem) => (
                      <GameListItemView key={game.id} game={game} />
                    ))}
                  </List>
                </div>

                <div className="mt-12 hidden grid-cols-1 gap-8 md:grid md:grid-cols-2 lg:grid-cols-3">
                  {featuredGames.map((game: GameListItem) => (
                    <article
                      key={game.id}
                      className="border-border/70 bg-card/80 hover:border-primary/50 flex h-full flex-col justify-between gap-4 rounded-3xl border p-6 text-left shadow-sm transition"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">{game.name}</h3>
                        {game.description ? (
                          <p className="text-muted-foreground line-clamp-3 text-sm">
                            {game.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground space-y-2 text-sm">
                        <p className="flex items-start gap-2">
                          <span aria-hidden>📍</span>
                          <span className="flex-1">{game.location.address}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span aria-hidden>🗓️</span>
                          <span className="flex-1">
                            {formatDateAndTime(game.dateTime)}
                          </span>
                        </p>
                      </div>
                      <Link
                        to="/game/$gameId"
                        params={{ gameId: game.id }}
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "mt-2 self-start rounded-full",
                        )}
                      >
                        View details
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}
            <div className="mt-12 flex justify-center">
              <Link
                to="/search"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
              >
                Browse all local games
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h2 className="font-heading text-3xl sm:text-4xl">
                  Popular game systems
                </h2>
                <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
                  Sessions most frequently booked by the community over the past few
                  weeks.
                </p>
              </div>
              <Link
                to="/systems"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "self-start rounded-full px-5",
                )}
              >
                Browse all systems
              </Link>
            </div>

            {popularSystems.length === 0 ? (
              <p className="text-muted-foreground/80 mt-10 text-center text-sm">
                We’ll highlight popular systems once more sessions are scheduled.
              </p>
            ) : (
              <div className="mt-10 overflow-x-auto pb-4">
                <div className="flex gap-6 pb-2">
                  {popularSystems.map((system) => (
                    <Link
                      key={system.id}
                      to="/systems/$slug"
                      params={{ slug: system.slug }}
                      className="focus-visible:ring-offset-background group border-border/70 bg-card/80 hover:border-primary/50 hover:bg-card/90 w-64 flex-shrink-0 rounded-3xl border px-3 pt-3 pb-4 shadow-sm transition sm:w-72 sm:px-4 sm:pt-4 sm:pb-5"
                    >
                      <div className="bg-muted h-40 w-full overflow-hidden rounded-2xl">
                        {system.heroUrl ? (
                          <img
                            src={system.heroUrl}
                            alt={`${system.name} cover art`}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full w-full items-center justify-center px-4 text-center text-sm">
                            Hero art pending moderation
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold">{system.name}</h3>
                          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            {system.gameCount} sessions
                          </span>
                        </div>
                        {system.summary ? (
                          <p className="text-muted-foreground/90 line-clamp-3 text-sm">
                            {system.summary}
                          </p>
                        ) : (
                          <p className="text-muted-foreground/70 text-sm">
                            Description coming soon.
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border-border/60 bg-muted/30 border-t py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading mb-12 text-3xl md:text-4xl">How it works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {["Find a local game", "Join a session", "Play in person"].map(
                (title, index) => {
                  const descriptions = [
                    "Search for tabletop RPGs, board game meetups, and events happening near you.",
                    "Connect with Game Masters and fellow players. RSVP or book your spot directly.",
                    "Enjoy immersive gaming experiences and build a local gaming community.",
                  ];

                  return (
                    <div
                      key={title}
                      className="border-border/60 bg-card/60 flex flex-col items-center rounded-3xl border p-6 text-center shadow-sm"
                    >
                      <div className="bg-primary/15 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                        {index + 1}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {descriptions[index]}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden py-16 text-center sm:py-20">
          <div className="from-primary/80 via-primary to-primary/80 absolute inset-0 -z-10 bg-gradient-to-r" />
          <div className="container mx-auto px-4">
            <div className="text-primary-foreground mx-auto max-w-2xl space-y-6">
              <h2 className="font-heading text-3xl md:text-4xl">
                Ready to host your own game?
              </h2>
              <p className="text-lg sm:text-xl">
                Share your passion! Become a Game Master or host a board game meetup in
                your area.
              </p>
              <Link
                to="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-full px-8",
                )}
              >
                Become a host
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
