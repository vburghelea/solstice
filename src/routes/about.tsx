import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const values = [
  {
    title: "Community First",
    description:
      "We build inclusive programs that celebrate the diversity of Canada’s Quadball community—welcoming athletes, volunteers, and fans of every background.",
    icon: UsersIcon,
  },
  {
    title: "Excellence on Pitch",
    description:
      "From grassroots coaching to Team Canada selection camps, we provide the infrastructure athletes need to compete at their best on the national and international stage.",
    icon: Trophy,
  },
  {
    title: "Year-Round Development",
    description:
      "Education, clinics, and scheduling support empower clubs to run safe, sustainable seasons in every region of the country.",
    icon: CalendarIcon,
  },
];

const leadership = [
  {
    name: "Avery Sinclair",
    role: "Executive Director",
    focus: "Strategic growth, national partnerships, and high-performance pathways",
  },
  {
    name: "Maya Desrochers",
    role: "Director of Sport Development",
    focus: "Club support, youth programming, and coaching resources",
  },
  {
    name: "Jordan Patel",
    role: "Director of Events & Operations",
    focus: "Nationals, regional circuits, and volunteer mobilization",
  },
];

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="About Quadball Canada"
        title="A national federation progressing the future of Quadball"
        subtitle="Since 2011 we’ve supported local clubs, delivered world-class tournaments, and guided Team Canada on the international stage—all powered by passionate volunteers."
        backgroundImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80"
        ctaText="Explore our programs"
        ctaLink="/resources"
        secondaryCta={{
          text: "Meet our teams",
          link: "/teams",
        }}
      />

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              Our Mission
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Growing Quadball sustainably from coast to coast
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Quadball Canada exists to support every athlete’s journey—from their first
              pickup practice to international competition. We collaborate with club
              leaders, officials, and volunteers to provide safe sport standards, season
              planning, and high-quality officiating across the country. Our staff and
              board work hand in hand with provincial hubs to deliver memorable events and
              inclusive programming.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              We are a volunteer-powered, athlete-centred federation guided by values of
              respect, accountability, and accessibility. Together we believe the culture
              of Quadball should reflect the communities that play it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/events">
                <Button className="btn-brand-primary">See upcoming events</Button>
              </Link>
              <a href="mailto:info@quadball.ca">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  Partner with us
                </Button>
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Strategic priorities</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                • Expand youth and scholastic programming in every province by 2026.
              </li>
              <li>
                • Deliver carbon-conscious national events with sustainable travel plans.
              </li>
              <li>• Launch bilingual coaching pathways and officiating accreditation.</li>
              <li>
                • Increase safe sport and safeguarding compliance across all member clubs.
              </li>
            </ul>
            <p className="mt-6 text-xs tracking-[0.3em] text-gray-500 uppercase">
              2024-2027 strategic plan
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            What guides our work
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base">
            Our pillars shape every decision—from program funding to event design. They
            ensure the sport we steward is vibrant, equitable, and distinctly Canadian.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="bg-brand-red/10 text-brand-red flex h-10 w-10 items-center justify-center rounded-full">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                Leadership
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Board & national staff
              </h2>
              <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
                Volunteers and staff from across Canada contribute expertise in sport
                administration, operations, education, and finance. Interested in joining
                a committee? We’re always looking for skilled contributors.
              </p>
            </div>
            <a
              href="mailto:volunteer@quadball.ca"
              className="text-brand-red text-sm font-semibold tracking-wide uppercase hover:underline"
            >
              Volunteer with us →
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {leadership.map((leader) => (
              <div
                key={leader.name}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">{leader.name}</h3>
                <p className="text-brand-red text-sm font-medium">{leader.role}</p>
                <p className="mt-3 text-sm text-gray-600">{leader.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
