import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DataErrorState } from "~/components/ui/data-state";
import { EventCard, EventCardSkeleton } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { PublicLayout } from "~/features/layouts/public-layout";

const UPCOMING_EVENTS_LIMIT = 6;

export const Route = createFileRoute("/")({
  loader: async () => {
    const events = (await getUpcomingEvents({
      data: { limit: UPCOMING_EVENTS_LIMIT },
    })) as EventWithDetails[];
    return { events };
  },
  component: Home,
});

function Home() {
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
    { label: "Active Clubs Nationwide", value: "10" },
    { label: "Youth Programs", value: "5 Cities" },
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
        eyebrow="Play. Compete. Grow."
        title="Fueling the growth of Quadball across Canada"
        subtitle="Quadball Canada connects clubs, athletes, and volunteers coast-to-coast—from grassroots programs to high-performance teams—so everyone can experience the magic of the sport."
        backgroundImage="https://images.unsplash.com/photo-1502810190503-8303352d0dd1?auto=format&fit=crop&w=2000&q=80"
        ctaText="Find Your Next Event"
        ctaLink="/events"
        secondaryCta={{
          text: "Connect With a Team",
          link: "/teams",
        }}
      />

      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid gap-6 rounded-2xl bg-gray-50 p-6 text-center shadow-sm sm:grid-cols-3 sm:p-8">
            {highlights.map((item) => (
              <div key={item.label} className="space-y-2">
                <p className="text-brand-red text-3xl font-bold sm:text-4xl">
                  {item.value}
                </p>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
              </div>
            ))}
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
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Mark Your Calendar</h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
                Championship tournaments, regional development camps, community
                festivals—discover where the next Quadball moments are being made.
              </p>
            </div>
            <Link
              to="/events"
              className="text-brand-red text-sm font-semibold tracking-wide uppercase hover:underline"
            >
              View all events →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && skeletonKeys.map((key) => <EventCardSkeleton key={key} />)}
            {!isLoading && isError && events.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataErrorState
                  title="We couldn’t load the latest events"
                  description={error instanceof Error ? error.message : undefined}
                  onRetry={() => refetch()}
                />
              </div>
            )}
            {!isLoading && !isError && events.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600 sm:col-span-2 lg:col-span-3">
                We’re finalizing the next wave of competitions. Check back soon or
                subscribe to our newsletter for updates.
              </div>
            )}
            {!isLoading &&
              events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="bg-brand-red/10 text-brand-red flex h-12 w-12 items-center justify-center rounded-full">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-12 text-white sm:py-16 lg:py-20">
        <div className="container mx-auto flex flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-10">
          <div className="flex-1 space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              Spotlight
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Team Canada gears up for the 2025 IQA World Cup
            </h2>
            <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
              Our national training squad is heading west for a high-performance residency
              in Vancouver. Follow roster announcements, livestream dates, and volunteer
              opportunities as we chase the podium on the world stage.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/resources#high-performance">
                <Button className="btn-brand-primary">Support Team Canada</Button>
              </a>
              <Link to="/teams">
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Meet the roster
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80"
              alt="Team Canada Quadball players practicing"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              Stay Competitive
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Training plans, rulebooks, and clinic replays
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Coaches and captains can access ready-made practice plans, certified
              officiating resources, and high-performance seminar recordings tailored for
              Canadian clubs. Build safe, inclusive programs with support from our
              national development staff.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/resources">
                <Button className="btn-brand-primary">Browse resources</Button>
              </a>
              <Link to="/teams">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  Start a club toolkit
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-brand-red h-10 w-10" />
              <div>
                <h3 className="text-lg font-semibold">Monthly development calls</h3>
                <p className="text-sm text-gray-600">Every first Sunday · 7pm ET</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li>
                <Sparkles className="text-brand-red mr-2 inline h-4 w-4" /> Coaching
                clinics with national team staff
              </li>
              <li>
                <Sparkles className="text-brand-red mr-2 inline h-4 w-4" /> Safe sport &
                safeguarding certification support
              </li>
              <li>
                <Sparkles className="text-brand-red mr-2 inline h-4 w-4" /> Equipment and
                grant funding opportunities
              </li>
              <li>
                <Sparkles className="text-brand-red mr-2 inline h-4 w-4" /> Marketing kits
                to grow your local fan base
              </li>
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
