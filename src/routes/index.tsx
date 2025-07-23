import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "~/features/layouts/public-layout";
import { Button } from "~/shared/ui/button";
import { EventCard } from "~/shared/ui/event-card";
import { HeroSection } from "~/shared/ui/hero-section";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <PublicLayout>
      <HeroSection
        title="Welcome to Quadball Canada"
        subtitle="Your hub for all things Quadball in Canada. Stay updated on events, teams, and resources."
        backgroundImage="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1893"
        ctaText="Explore Events"
        ctaLink="/events"
      />

      <section className="bg-gray-50 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <EventCard
              title="National Championship"
              description="Join us for the biggest Quadball event of the year!"
              image="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1740"
              link="/events/national-championship"
            />
            <EventCard
              title="Regional Training Camp"
              description="Improve your skills with top coaches in the region."
              image="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1740"
              link="/events/training-camp"
            />
            <EventCard
              title="Community Meetup"
              description="Connect with fellow Quadball enthusiasts in your area."
              image="https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1674"
              link="/events/community-meetup"
            />
          </div>
          <div className="mt-8 text-center sm:mt-12">
            <Link to="/events" className="text-brand-red font-semibold hover:underline">
              View all events →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1740"
                alt="Team celebrating"
                className="w-full rounded-lg shadow-xl"
              />
            </div>
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">Latest News</h2>
              <h3 className="mb-3 text-lg font-semibold sm:text-xl">
                New Team Registration Opens
              </h3>
              <p className="mb-6 px-4 text-gray-600 sm:px-0">
                Register your team for the upcoming season and compete for the
                championship.
              </p>
              <Link to="/register">
                <Button className="btn-brand-primary">Register Now →</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
