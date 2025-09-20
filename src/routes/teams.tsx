import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { MapPinIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const pathways = [
  {
    title: "University & College Clubs",
    description:
      "Campus programs in every region drive competitive play, intramural leagues, and rookie recruitment. Tap into our season planning templates and officiating support.",
    icon: UsersIcon,
  },
  {
    title: "Community & City Leagues",
    description:
      "Adult leagues keep Quadball active year-round with mixed skill divisions, house teams, and travelling squads. We can help with scheduling, insurance, and grant applications.",
    icon: MapPinIcon,
  },
  {
    title: "Youth & School Programs",
    description:
      "Introduce the sport in classrooms and youth centres with modified rules, inclusive drills, and coach education that scales from introductory sessions to regional jamborees.",
    icon: Trophy,
  },
];

const resources = [
  {
    title: "Club starter toolkit",
    copy: "Download constitution templates, budget planners, and volunteer role descriptions to launch a sustainable program.",
    link: "/resources#club-toolkit",
  },
  {
    title: "Practice & fitness library",
    copy: "Access progressive training plans, skills videos, and goalkeeper clinics designed by national team staff.",
    link: "/resources#training",
  },
  {
    title: "Safe sport & safeguarding",
    copy: "Stay compliant with national policies covering background checks, injury reporting, and inclusive program design.",
    link: "/resources#safe-sport",
  },
];

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Teams & Clubs"
        title="Find your squad or build one from the ground up"
        subtitle="From coast-to-coast, Quadball clubs are recruiting athletes, coaches, officials, and volunteers. Discover teams near you and access the resources to help your program thrive."
        backgroundImage="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80"
        ctaText="Browse club resources"
        ctaLink="/resources"
        secondaryCta={{
          text: "Start a new club",
          link: "/resources#club-toolkit",
        }}
      />

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {pathways.map((pathway) => (
              <div
                key={pathway.title}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="bg-brand-red/10 text-brand-red flex h-12 w-12 items-center justify-center rounded-full">
                  <pathway.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {pathway.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{pathway.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              Connect locally
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Club finder & regional hubs
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Our regional coordinators maintain an active directory of university,
              community, and youth teams. Whether you are relocating, recruiting, or
              looking for exhibition play, we can link you with the right contacts in
              seconds.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Hosting a tournament or wanting to scrimmage? Submit your details and we’ll
              broadcast the request to neighbouring programs and officials across the
              country.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:clubs@quadball.ca">
                <Button className="btn-brand-primary">Email regional support</Button>
              </a>
              <Link to="/events">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  List your event
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Information we share</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• Club contacts and practice schedules</li>
              <li>• Referee and scorekeeping availability</li>
              <li>• Equipment loan programs and storage solutions</li>
              <li>• Billeting networks for travelling teams</li>
            </ul>
            <p className="mt-6 text-xs tracking-[0.3em] text-gray-500 uppercase">
              Updated monthly with club submissions
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Tools for every stage
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base">
            Jump straight into program building with templates and training content
            maintained by our development team.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {resources.map((resource) => (
              <div key={resource.title} className="rounded-2xl bg-gray-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{resource.copy}</p>
                <a
                  href={resource.link}
                  className="text-brand-red mt-4 inline-block text-sm font-semibold hover:underline"
                >
                  Open resource →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
