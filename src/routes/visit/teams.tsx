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
      "Adult leagues keep tabletop nights thriving year-round with mixed skill divisions, house tables, and travelling meetup groups. We can help with scheduling, insurance, and grant applications.",
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
    link: "/visit/resources#club-toolkit",
  },
  {
    title: "Practice & fitness library",
    copy: "Access progressive training plans, skills videos, and goalkeeper clinics designed by national team staff.",
    link: "/visit/resources#training",
  },
  {
    title: "Safe sport & safeguarding",
    copy: "Stay compliant with national policies covering background checks, injury reporting, and inclusive program design.",
    link: "/visit/resources#safe-sport",
  },
];

export const Route = createFileRoute("/visit/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Teams & Clubs"
        title="Find your squad or build one from the ground up"
        subtitle="From coast-to-coast, tabletop communities are recruiting hosts, storytellers, rules gurus, and volunteers. Discover groups near you and access the resources to help your program thrive."
        backgroundImage="/images/hero-tabletop-board-game-teams-optimized.png"
        ctaText="Browse club resources"
        ctaLink="/visit/resources"
        secondaryCta={{
          text: "Start a new club",
          link: "/visit/resources#club-toolkit",
        }}
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pathways.map((pathway) => (
              <div
                key={pathway.title}
                className="border-border bg-card rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                  <pathway.icon className="h-6 w-6" />
                </div>
                <h3 className="text-foreground mt-4 text-lg font-semibold">
                  {pathway.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {pathway.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-primary text-sm font-semibold tracking-[0.3em] uppercase">
              Connect locally
            </p>
            <h2 className="text-foreground text-2xl font-bold sm:text-3xl">
              Club finder & regional hubs
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              Our regional coordinators maintain an active directory of university,
              community, and youth teams. Whether you are relocating, recruiting, or
              looking for exhibition play, we can link you with the right contacts in
              seconds.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              Hosting a tournament or wanting to scrimmage? Submit your details and we’ll
              broadcast the request to neighbouring programs and officials across the
              country.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:clubs@roundup.games">
                <Button className="btn-brand-primary">Email regional support</Button>
              </a>
              <Link to="/visit/events">
                <Button
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  List your event
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <h3 className="text-foreground text-lg font-semibold">
              Information we share
            </h3>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>• Club contacts and practice schedules</li>
              <li>• Referee and scorekeeping availability</li>
              <li>• Equipment loan programs and storage solutions</li>
              <li>• Billeting networks for travelling teams</li>
            </ul>
            <p className="text-muted-foreground mt-6 text-xs tracking-[0.3em] uppercase">
              Updated monthly with club submissions
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-foreground text-center text-2xl font-bold sm:text-3xl">
            Tools for every stage
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base">
            Jump straight into program building with templates and training content
            maintained by our development team.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {resources.map((resource) => (
              <div
                key={resource.title}
                className="border-border bg-card rounded-2xl border p-6 shadow-sm"
              >
                <h3 className="text-foreground text-lg font-semibold">
                  {resource.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">{resource.copy}</p>
                <a
                  href={resource.link}
                  className="text-primary mt-4 inline-block text-sm font-semibold hover:underline"
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
