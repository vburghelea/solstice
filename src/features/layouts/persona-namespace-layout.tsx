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
        <div className="token-gap-lg token-section-padding-sm mx-auto flex w-full max-w-5xl flex-col">
          <div className="token-gap-md flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="token-stack-sm">
              <p className="text-eyebrow text-subtle">{hero.eyebrow}</p>
              <div className="token-stack-xs">
                <h1 className="text-heading-lg text-foreground">{hero.title}</h1>
                <p className="text-body-lg text-muted-strong">{hero.description}</p>
              </div>
            </div>
            <RoleSwitcher />
          </div>
          {hero.supportingText ? (
            <p className="text-body-sm text-muted-strong">{hero.supportingText}</p>
          ) : null}
          {annotation}
        </div>
      </header>
      <main className="token-gap-xl token-section-padding mx-auto flex w-full max-w-5xl flex-1 flex-col">
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
    <div className="bg-surface-subtle border-subtle text-subtle token-gap-xs flex flex-col rounded-xl border border-dashed p-6">
      <span className="text-eyebrow">Loading workspace</span>
      <p className="text-body-sm">Preparing the {label.toLowerCase()} experience...</p>
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
    <div className="token-gap-sm grid md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-lg border border-dashed border-[color:color-mix(in_oklab,var(--primary-soft)_60%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_30%,var(--surface-default)_70%)] p-4 text-[color:color-mix(in_oklab,var(--primary-strong)_85%,black_15%)]"
        >
          <p className="text-body-sm text-foreground font-semibold">{item.title}</p>
          <p className="text-body-sm text-muted-strong">{item.description}</p>
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
    <section className="token-stack-lg">
      <Card className="bg-surface-elevated border-subtle border border-dashed">
        <CardHeader>
          <CardTitle className="text-heading-sm">{title}</CardTitle>
          <CardDescription className="text-body-md text-muted-strong">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="token-stack-sm">
            {milestones.map((milestone) => (
              <li key={milestone.title} className="token-gap-sm flex">
                <span aria-hidden className="text-[color:var(--primary-base)]">
                  •
                </span>
                <div>
                  <p className="text-body-sm text-foreground font-semibold">
                    {milestone.title}
                  </p>
                  <p className="text-body-sm text-muted-strong">
                    {milestone.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-body-sm text-muted-strong">
        {`Need to explore another perspective while we finish the ${personaLabel.toLowerCase()} workspace? Use the persona switcher above to jump between experiences.`}
      </p>
    </section>
  );
}

export { PersonaComingSoon } from "./persona-coming-soon";
export type { PersonaComingSoonProps } from "./persona-coming-soon";
