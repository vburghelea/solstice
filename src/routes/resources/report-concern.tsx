import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import {
  AlertCircle,
  CheckCircle2,
  PenSquareIcon,
  UsersIcon,
} from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const reportSteps = [
  {
    title: "Make sure everyone is safe",
    description:
      "If anyone is in immediate danger, contact local emergency services first. Our response team will coordinate follow-up support once the situation is stable.",
    icon: AlertCircle,
  },
  {
    title: "Collect key details",
    description:
      "Write down what happened, when it occurred, who was involved, and any immediate actions taken. Include links, screenshots, or photos if relevant.",
    icon: PenSquareIcon,
  },
  {
    title: "Reach the right team",
    description:
      "Choose the reporting channel below that matches the concern. If you are unsure, contact the hotline and we will route the request.",
    icon: UsersIcon,
  },
];

const channelCards = [
  {
    title: "Urgent safety concern",
    description:
      "Physical harm, harassment, or severe emotional distress happening right now at an event.",
    contact: "24/7 Safety Hotline",
    actionLabel: "Call 1-855-ROUNDUP",
    actionHref: "tel:+18557686387",
    notes:
      "Available for registered coordinators and venue managers. Interpreters and real-time captioning available on request.",
  },
  {
    title: "Code of conduct violation",
    description:
      "Reports involving harassment, discrimination, bullying, or repeated disruptive behavior.",
    contact: "Conduct Response Team",
    actionLabel: "Email conduct@roundup.games",
    actionHref: "mailto:conduct@roundup.games",
    notes:
      "Expect a confirmation within 12 hours and a full follow-up plan within 48 hours.",
  },
  {
    title: "Data or platform issue",
    description:
      "Suspected account compromise, privacy concerns, or bugs exposing sensitive information.",
    contact: "Security & Platform Team",
    actionLabel: "Email security@roundup.games",
    actionHref: "mailto:security@roundup.games",
    notes:
      "Critical vulnerabilities are triaged within two hours. We coordinate responsible disclosure and status updates.",
  },
  {
    title: "Accessibility request",
    description:
      "Accommodations, interpretation support, or barrier removal for upcoming programs.",
    contact: "Accessibility Desk",
    actionLabel: "Email accessibility@roundup.games",
    actionHref: "mailto:accessibility@roundup.games",
    notes:
      "We will respond within one business day with next steps or scheduling options.",
  },
];

export const Route = createFileRoute("/resources/report-concern")({
  component: ReportConcernPage,
});

function ReportConcernPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Report a concern"
        title="We're here to help—day or night"
        subtitle="Roundup Games takes every report seriously. Reach out so we can keep our community safe, supported, and informed."
        backgroundImage={RESOURCES_HERO_IMAGE}
        ctaText="View reporting steps"
        ctaLink="#reporting-steps"
        secondaryCta={{
          text: "Visit safety policies",
          link: "/resources/safety-policies",
        }}
      />

      <section
        id="reporting-steps"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              How to report
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              We respond quickly and keep you informed
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Follow these steps so we can protect participants and resolve incidents with
              care. Our team will acknowledge your report, outline next steps, and share
              updates until the matter is closed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {reportSteps.map((step) => (
              <Card key={step.title} className={cardSurfaceClass}>
                <CardHeader className="flex items-start gap-4">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <step.icon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {step.title}
                    </CardTitle>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Choose a channel
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Dedicated teams ready to respond
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Use the option that best fits the situation so we can activate the correct
              responders. If you prefer anonymous reporting, select "Conduct Response
              Team" and indicate that desire in the form.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {channelCards.map((channel) => (
              <Card key={channel.title} className={mutedCardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {channel.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Contact: {channel.contact}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{channel.description}</p>
                  <Button asChild>
                    <a href={channel.actionHref}>{channel.actionLabel}</a>
                  </Button>
                  <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    {channel.notes}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              After you report
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              What to expect from our response team
            </h2>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              <li>• Acknowledgement receipt with assigned responder within 12 hours</li>
              <li>• Tailored safety plan and timeline for next updates</li>
              <li>• Options for restorative conversations or formal investigations</li>
              <li>
                • Closure summary with follow-up resources and future prevention steps
              </li>
            </ul>
          </div>
          <div className={cardSurfaceClass + " space-y-4"}>
            <div className="flex items-start gap-4">
              <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Prefer to talk live?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Schedule a call with a member of the community care team. We can bring
                  in additional specialists based on the nature of your concern.
                </p>
                <Button asChild variant="outline" className="justify-center sm:w-fit">
                  <a href="https://cal.com/roundupgames/community-care">
                    Book a care conversation
                  </a>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <p>
                Anonymous reports are investigated with the same urgency. We will share
                what actions were taken via a public update when we cannot follow up
                directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Support resources
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            We partner with local organizations who specialize in mental health, victim
            services, and restorative processes. If you need additional care, let us know
            and we will connect you.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Mental health warmline",
                description:
                  "Peer support for stress, burnout, and processing tough sessions.",
                linkLabel: "Call 1-888-555-2222",
                linkHref: "tel:+18885552222",
              },
              {
                title: "Restorative circle facilitators",
                description:
                  "Independent practitioners trained in trauma-informed, community-led healing.",
                linkLabel: "Request referral",
                linkHref: "mailto:care@roundup.games?subject=Restorative%20support",
              },
              {
                title: "Digital safety clinic",
                description:
                  "Security volunteers who help secure devices and accounts after incidents.",
                linkLabel: "Book an appointment",
                linkHref: "https://cal.com/roundupgames/security-clinic",
              },
            ].map((resource) => (
              <Card key={resource.title} className={mutedCardSurfaceClass}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {resource.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{resource.description}</p>
                  <Button asChild variant="outline" className="justify-center">
                    <a href={resource.linkHref}>{resource.linkLabel}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
