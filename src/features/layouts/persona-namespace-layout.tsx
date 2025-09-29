import { Outlet, useRouterState } from "@tanstack/react-router";
import { Suspense, useEffect, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { RoleSwitcher } from "~/features/roles/components/role-switcher";
import { trackPersonaNavigationImpression } from "~/features/roles/role-analytics";
import { useActivePersona } from "~/features/roles/role-switcher-context";

export interface PersonaNamespaceHero {
  eyebrow: string;
  title: string;
  description: string;
  supportingText?: string;
}

export interface PersonaNamespaceLayoutProps {
  hero: PersonaNamespaceHero;
  annotation?: ReactNode;
  fallback?: ReactNode;
  children?: ReactNode;
}

export function PersonaNamespaceLayout({
  hero,
  annotation,
  fallback,
  children,
}: PersonaNamespaceLayoutProps) {
  const activePersona = useActivePersona();
  const location = useRouterState({ select: (state) => state.location });
  const { analytics, id, namespacePath, label } = activePersona;

  useEffect(() => {
    void trackPersonaNavigationImpression(analytics, {
      personaId: id,
      namespacePath,
      pathname: location.pathname,
      source: "layout",
    });
  }, [analytics, id, namespacePath, location.pathname]);

  return (
    <div className="bg-background text-foreground flex min-h-dvh w-full flex-col">
      <header className="border-border from-background via-background to-muted/40 border-b bg-gradient-to-br">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {hero.eyebrow}
              </p>
              <div className="space-y-2">
                <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                  {hero.title}
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
                  {hero.description}
                </p>
              </div>
            </div>
            <RoleSwitcher />
          </div>
          {hero.supportingText ? (
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              {hero.supportingText}
            </p>
          ) : null}
          {annotation}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {children}
        <Suspense fallback={fallback ?? <PersonaNamespaceFallback label={label} />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

interface PersonaNamespaceFallbackProps {
  label: string;
}

export function PersonaNamespaceFallback({ label }: PersonaNamespaceFallbackProps) {
  return (
    <div className="border-border text-muted-foreground bg-muted/40 flex flex-col gap-2 rounded-xl border border-dashed p-6">
      <span className="text-xs font-semibold tracking-wide uppercase">
        Loading workspace
      </span>
      <p className="text-sm">Preparing the {label.toLowerCase()} experience...</p>
    </div>
  );
}

export interface PersonaPillarItem {
  title: string;
  description: string;
}

export function PersonaNamespacePillars({
  items,
}: {
  readonly items: PersonaPillarItem[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="border-border/70 bg-primary/5 text-primary/90 rounded-lg border border-dashed p-4"
        >
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-sm leading-relaxed">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export interface PersonaWorkspaceMilestone {
  title: string;
  description: string;
}

interface PersonaWorkspacePlaceholderProps {
  personaLabel: string;
  title: string;
  description: string;
  milestones: PersonaWorkspaceMilestone[];
}

export function PersonaWorkspacePlaceholder({
  personaLabel,
  title,
  description,
  milestones,
}: PersonaWorkspacePlaceholderProps) {
  return (
    <section className="space-y-6">
      <Card className="border-border bg-card/80 border border-dashed">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {milestones.map((milestone) => (
              <li key={milestone.title} className="flex gap-3">
                <span aria-hidden className="text-primary">
                  •
                </span>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {milestone.title}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {`Need to explore another perspective while we finish the ${personaLabel.toLowerCase()} workspace? Use the persona switcher above to jump between experiences.`}
      </p>
    </section>
  );
}

export { PersonaComingSoon } from "./persona-coming-soon";
export type { PersonaComingSoonProps } from "./persona-coming-soon";
