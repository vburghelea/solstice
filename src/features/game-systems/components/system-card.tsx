import { SafeLink as Link } from "~/components/ui/SafeLink";

import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { GameSystemListItem } from "~/features/game-systems/game-systems.types";
import { cn } from "~/shared/lib/utils";

interface SystemCardProps {
  system: GameSystemListItem;
}

export function SystemCard({ system }: SystemCardProps) {
  const heroAlt = `${system.name} hero artwork`;
  const playersLabel = (() => {
    if (system.minPlayers && system.maxPlayers) {
      return `${system.minPlayers}-${system.maxPlayers} players`;
    }
    if (system.minPlayers) {
      return `${system.minPlayers}+ players`;
    }
    if (system.maxPlayers) {
      return `Up to ${system.maxPlayers} players`;
    }
    return "Players: TBD";
  })();

  return (
    <Card className="text-foreground overflow-hidden border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-neutral-100 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/75 dark:text-gray-50">
      <Link to="/visit/systems/$slug" params={{ slug: system.slug }} className="block">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-700">
          {system.heroUrl ? (
            <img
              src={system.heroUrl}
              alt={heroAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-200 dark:text-slate-100">
              Hero art pending moderation
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">{system.name}</CardTitle>
        {system.summary ? (
          <CardDescription className="text-muted-foreground line-clamp-2 text-sm dark:text-gray-300">
            {system.summary}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs font-medium tracking-wide uppercase dark:text-gray-400">
          <span>{playersLabel}</span>
          <span className="bg-border h-2 w-[1px]" aria-hidden />
          <span>Publisher: {system.publisher ? system.publisher.name : "TBD"}</span>
          {system.yearReleased ? (
            <>
              <span className="bg-border h-2 w-[1px]" aria-hidden />
              <span>Released {system.yearReleased}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {system.categories.length > 0 ? (
            system.categories.slice(0, 3).map((category) => (
              <Badge
                key={`category-${category.id}`}
                variant="secondary"
                className="bg-primary/10 text-primary-foreground dark:bg-primary/25 dark:text-primary-100"
              >
                {category.name}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
              Taxonomy pending
            </Badge>
          )}
        </div>

        {system.mechanics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {system.mechanics.slice(0, 3).map((mechanic) => (
              <Badge
                key={`mechanic-${mechanic.id}`}
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300"
              >
                {mechanic.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          to="/visit/systems/$slug"
          params={{ slug: system.slug }}
          className={cn(buttonVariants({ size: "sm" }), "ml-auto")}
        >
          View details
        </Link>
      </CardFooter>
    </Card>
  );
}
