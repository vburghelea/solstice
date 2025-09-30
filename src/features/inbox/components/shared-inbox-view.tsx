import { format, formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";

import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/shared/lib/utils";

import {
  PERSONA_INBOX_CONFIG,
  SHARED_INBOX_THREADS,
} from "~/features/inbox/data/shared-inbox.fixtures";
import { type PersonaId, type SharedInboxThread } from "~/features/inbox/types";

const THREAD_STATUS_LABEL: Record<SharedInboxThread["status"], string> = {
  open: "Open",
  waiting: "Waiting on response",
  resolved: "Resolved",
};

const THREAD_PRIORITY_STYLE: Record<SharedInboxThread["priority"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-muted",
};

type SharedInboxViewProps = {
  persona: PersonaId;
  userName?: string | null;
};

export function SharedInboxView(props: SharedInboxViewProps) {
  const { persona, userName } = props;
  const personaConfig = PERSONA_INBOX_CONFIG[persona];
  const personaThreads = useMemo(
    () => SHARED_INBOX_THREADS.filter((thread) => thread.personas.includes(persona)),
    [persona],
  );

  const [selectedFilter, setSelectedFilter] = useState(
    personaConfig.filters[0]?.id ?? "all",
  );

  const filterCounts = useMemo(() => {
    return personaConfig.filters.reduce<Record<string, number>>((acc, filter) => {
      if (filter.id === "all") {
        acc[filter.id] = personaThreads.length;
        return acc;
      }
      acc[filter.id] = personaThreads.filter((thread) =>
        thread.categories.includes(filter.id),
      ).length;
      return acc;
    }, {});
  }, [personaConfig.filters, personaThreads]);

  const filteredThreads = useMemo(() => {
    if (selectedFilter === "all") {
      return personaThreads;
    }
    return personaThreads.filter((thread) => thread.categories.includes(selectedFilter));
  }, [personaThreads, selectedFilter]);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    () => personaThreads[0]?.id ?? null,
  );

  const activeThreadId = useMemo(() => {
    if (!selectedThreadId) {
      return filteredThreads[0]?.id ?? null;
    }
    const isAvailable = filteredThreads.some((thread) => thread.id === selectedThreadId);
    if (isAvailable) {
      return selectedThreadId;
    }
    return filteredThreads[0]?.id ?? null;
  }, [filteredThreads, selectedThreadId]);

  const selectedThread = useMemo(() => {
    if (!activeThreadId) {
      return null;
    }
    return (
      filteredThreads.find((thread) => thread.id === activeThreadId) ??
      personaThreads.find((thread) => thread.id === activeThreadId) ??
      null
    );
  }, [activeThreadId, filteredThreads, personaThreads]);

  const unreadCount = useMemo(
    () => personaThreads.filter((thread) => thread.unreadFor.includes(persona)).length,
    [personaThreads, persona],
  );

  return (
    <div className="container mx-auto space-y-8 px-4 py-6 sm:py-8">
      <header className="space-y-3">
        <Badge variant="outline" className="text-xs tracking-wide uppercase">
          Collaboration beta
        </Badge>
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
            {personaConfig.heading}
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
            {personaConfig.description}
            {userName ? ` — tailored for ${userName}.` : ""}
          </p>
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm">
          {personaConfig.supportingCopy}
        </p>
        <div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/${persona}/collaboration`}>Open cross-namespace reporting</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{personaConfig.highlight.label}</CardTitle>
              <CardDescription>{personaConfig.highlight.value}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {personaConfig.highlight.description}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {personaConfig.quickMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="bg-muted flex items-center justify-between rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {metric.label}
                      </p>
                      <p className="text-foreground text-lg font-semibold">
                        {metric.value}
                      </p>
                    </div>
                    {metric.delta ? (
                      <Badge variant="outline">{metric.delta}</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>
                Focus the inbox by workflow or escalation type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {personaConfig.filters.map((filter) => {
                  const isActive = selectedFilter === filter.id;
                  const count = filterCounts[filter.id] ?? 0;
                  const label = `${filter.label}${filter.id === "all" ? "" : ` (${count})`}`;
                  return (
                    <Button
                      key={filter.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                {unreadCount} thread{unreadCount === 1 ? "" : "s"} awaiting your
                attention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Collaboration tips</CardTitle>
              <CardDescription>
                Align expectations when multiple personas share the thread.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {personaConfig.collaborationTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    •
                  </span>
                  <p className="text-muted-foreground text-sm">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">Threads</h2>
            <Button variant="outline" size="sm">
              Log internal note
            </Button>
          </div>
          <div className="space-y-3">
            {filteredThreads.length === 0 ? (
              <Card className="items-center justify-center gap-2 px-6 py-8 text-center">
                <CardTitle className="text-base">No threads yet</CardTitle>
                <CardDescription>
                  Switch filters or invite collaborators to start a shared conversation.
                </CardDescription>
              </Card>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  persona={persona}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  onSelect={() => setSelectedThreadId(thread.id)}
                />
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-5">
          {selectedThread ? (
            <ThreadDetail persona={persona} thread={selectedThread} />
          ) : (
            <Card className="items-center justify-center gap-2 px-6 py-10 text-center">
              <CardTitle className="text-base">Select a thread</CardTitle>
              <CardDescription>
                Choose a conversation to view cross-persona context, notes, and action
                items.
              </CardDescription>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

type ThreadListItemProps = {
  persona: PersonaId;
  thread: SharedInboxThread;
  isActive: boolean;
  onSelect: () => void;
};

function ThreadListItem(props: ThreadListItemProps) {
  const { persona, thread, isActive, onSelect } = props;
  const latestUpdate = formatDistanceToNow(new Date(thread.updatedAt), {
    addSuffix: true,
  });
  const isUnread = thread.unreadFor.includes(persona);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "border-border/60 hover:border-border/80 bg-background text-left",
        "w-full rounded-xl border px-5 py-4 transition-colors",
        isActive ? "border-primary/60 bg-primary/5" : "hover:bg-accent/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-sm font-semibold">{thread.subject}</p>
            {isUnread ? (
              <span className="bg-primary text-primary-foreground inline-flex size-2 rounded-full" />
            ) : null}
          </div>
          <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
            {thread.preview}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={THREAD_PRIORITY_STYLE[thread.priority]}>
              {thread.priority === "high"
                ? "High"
                : thread.priority === "medium"
                  ? "Medium"
                  : "Low"}
            </Badge>
            <Badge variant="outline">{THREAD_STATUS_LABEL[thread.status]}</Badge>
            {thread.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">{latestUpdate}</span>
      </div>
    </button>
  );
}

type ThreadDetailProps = {
  persona: PersonaId;
  thread: SharedInboxThread;
};

function ThreadDetail(props: ThreadDetailProps) {
  const { persona, thread } = props;
  const participantsById = useMemo(() => {
    return thread.participants.reduce<
      Record<string, (typeof thread.participants)[number]>
    >((acc, participant) => {
      acc[participant.id] = participant;
      return acc;
    }, {});
  }, [thread]);

  const primaryActions = thread.actionItems ?? [];

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-2">
          <CardTitle className="text-foreground text-xl font-semibold">
            {thread.subject}
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge variant="outline">{THREAD_STATUS_LABEL[thread.status]}</Badge>
            <Badge variant="outline" className={THREAD_PRIORITY_STYLE[thread.priority]}>
              Priority: {thread.priority}
            </Badge>
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-3">
          {thread.participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-2">
              <Avatar
                name={participant.name}
                fallback={participant.avatarInitials}
                className="size-8"
              />
              <div className="leading-tight">
                <p className="text-foreground text-sm font-medium">{participant.name}</p>
                <p className="text-muted-foreground text-xs">{participant.roleLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        {primaryActions.length > 0 ? (
          <div className="bg-accent/30 space-y-3 rounded-lg border p-4">
            <p className="text-foreground text-sm font-semibold">Action items</p>
            <div className="space-y-2">
              {primaryActions.map((action) => {
                const isOwner = action.ownerPersona === persona;
                const dueLabel = action.dueAt
                  ? `Due ${format(new Date(action.dueAt), "MMM d, h:mma")}`
                  : null;
                return (
                  <div
                    key={action.id}
                    className="border-border/60 bg-background/70 flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2"
                  >
                    <Badge variant={isOwner ? "default" : "outline"}>
                      {isOwner ? "Yours" : action.ownerPersona}
                    </Badge>
                    <span className="text-foreground text-sm">{action.label}</span>
                    <span className="text-muted-foreground text-xs">
                      Status: {action.status.replace("-", " ")}
                    </span>
                    {dueLabel ? (
                      <span className="text-muted-foreground text-xs">{dueLabel}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-5">
          {thread.messages.map((message) => {
            const author = participantsById[message.authorId];
            const timestamp = formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
            });
            return (
              <div key={message.id} className="rounded-xl border px-4 py-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={author?.name}
                      fallback={author?.avatarInitials ?? "?"}
                      className="size-9"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-foreground text-sm font-semibold">
                          {author?.name ?? "Unknown"}
                        </p>
                        <Badge variant="outline">{author?.roleLabel}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{timestamp}</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {message.body}
                  </p>
                  {message.attachments?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        <Badge key={attachment.id} variant="secondary">
                          {attachment.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {message.reactions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {message.reactions.map((reaction) => (
                        <span
                          key={`${message.id}-${reaction.emoji}`}
                          className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-muted-foreground">{reaction.count}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <p className="text-muted-foreground text-xs">
          Last updated{" "}
          {formatDistanceToNow(new Date(thread.updatedAt), {
            addSuffix: true,
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Reply to thread</Button>
          <Button variant="outline" size="sm">
            Add follow-up task
          </Button>
        </div>
      </div>
    </Card>
  );
}
