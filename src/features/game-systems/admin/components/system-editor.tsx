import { useMutation } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Fragment, useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  mapExternalTag,
  moderateImage,
  selectHeroImage,
  triggerRecrawl,
  updateCmsApproval,
  updatePublishStatus,
} from "~/features/game-systems/game-systems.mutations";
import type { GameSystemTag } from "~/features/game-systems/game-systems.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { Input } from "~/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui/select";
import { getAdminGameSystem } from "../game-systems-admin.queries";
import type {
  AdminExternalTagMapping,
  AdminGameSystemCrawlEvent,
  AdminGameSystemDetail,
} from "../game-systems-admin.types";
import { SystemStatusPill } from "./system-status-pill";

type ExternalSourceOption = "startplaying" | "bgg" | "wikipedia";

type ExternalMappingRequest = {
  targetType: "category" | "mechanic";
  targetId: number;
  source: ExternalSourceOption;
  externalTag: string;
  confidence: number;
};

type RecrawlSourceOption = "manual" | ExternalSourceOption;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "content", label: "Content" },
  { value: "media", label: "Media" },
  { value: "taxonomy", label: "Taxonomy" },
  { value: "crawl", label: "Crawl" },
] as const;

export type AdminSystemEditorTab = (typeof TABS)[number]["value"];

export const DEFAULT_SYSTEM_EDITOR_TAB: AdminSystemEditorTab = "overview";

interface SystemEditorProps {
  system: AdminGameSystemDetail;
  activeTab: AdminSystemEditorTab;
  onTabChange: (tab: AdminSystemEditorTab) => void;
  onSystemChange: (nextSystem: AdminGameSystemDetail) => void;
}

export function SystemEditor({
  system,
  activeTab,
  onTabChange,
  onSystemChange,
}: SystemEditorProps) {
  const updatedRelative = formatRelativeTime(system.updatedAt);
  const statusPills =
    system.statusFlags.length === 0 ? (
      <Badge variant="secondary">Publish ready</Badge>
    ) : (
      system.statusFlags.map((flag) => <SystemStatusPill key={flag} flag={flag} />)
    );

  const refreshSystem = useCallback(async () => {
    const next = await getAdminGameSystem({ data: { systemId: system.id } });
    if (!next) {
      throw new Error("System not found after update.");
    }
    onSystemChange(next);
    return next;
  }, [system.id, onSystemChange]);

  const moderateMutation = useMutation({
    mutationFn: async ({
      mediaId,
      moderated,
    }: {
      mediaId: number;
      moderated: boolean;
    }) => {
      await moderateImage({ data: { systemId: system.id, mediaId, moderated } });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success("Media moderation updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update moderation";
      toast.error(message);
    },
  });

  const heroMutation = useMutation({
    mutationFn: async ({ mediaId }: { mediaId: number }) => {
      await selectHeroImage({ data: { systemId: system.id, mediaId } });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success("Hero image updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update hero image";
      toast.error(message);
    },
  });

  const externalMappingMutation = useMutation({
    mutationFn: async (payload: {
      targetType: "category" | "mechanic";
      targetId: number;
      source: "startplaying" | "bgg" | "wikipedia";
      externalTag: string;
      confidence: number;
    }) => {
      await mapExternalTag({
        data: {
          systemId: system.id,
          targetType: payload.targetType,
          targetId: payload.targetId,
          source: payload.source,
          externalTag: payload.externalTag,
          confidence: payload.confidence,
        },
      });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success("External tag mapped");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to map tag";
      toast.error(message);
    },
  });

  const recrawlMutation = useMutation({
    mutationFn: async ({ source }: { source: RecrawlSourceOption }) => {
      await triggerRecrawl({
        data: {
          systemId: system.id,
          source: source === "manual" ? undefined : source,
        },
      });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success("Recrawl queued");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to queue recrawl";
      toast.error(message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      await updatePublishStatus({ data: { systemId: system.id, isPublished: publish } });
      return refreshSystem();
    },
    onSuccess: (_, variables) => {
      toast.success(variables.publish ? "System published" : "System reverted to draft");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update publish status";
      toast.error(message);
    },
  });

  const cmsApprovalMutation = useMutation({
    mutationFn: async ({ approved }: { approved: boolean }) => {
      await updateCmsApproval({ data: { systemId: system.id, approved } });
      return refreshSystem();
    },
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? "CMS copy approved" : "CMS approval revoked");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update CMS approval";
      toast.error(message);
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-card text-card-foreground border shadow-sm">
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-card-foreground text-2xl font-semibold">{system.name}</h1>
            <p className="text-muted-foreground text-sm">
              Last updated {updatedRelative} • Slug:{" "}
              <span className="text-card-foreground/80 font-mono">{system.slug}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs tracking-wide uppercase">
            {statusPills}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/40 flex flex-wrap gap-2 border-t p-4">
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <Button
                key={tab.value}
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                aria-pressed={isActive}
                onClick={() => onTabChange(tab.value)}
                className={cn("rounded-full px-4", isActive ? "shadow-sm" : "")}
              >
                {tab.label}
              </Button>
            );
          })}
        </CardFooter>
      </Card>

      <section aria-live="polite">
        {activeTab === "overview" ? (
          <OverviewTab
            system={system}
            onPublish={(publish) => publishMutation.mutate({ publish })}
            onToggleApproval={(approved) => cmsApprovalMutation.mutate({ approved })}
            isPublishing={publishMutation.isPending}
            isApprovalPending={cmsApprovalMutation.isPending}
          />
        ) : null}
        {activeTab === "content" ? <ContentTab system={system} /> : null}
        {activeTab === "media" ? (
          <MediaTab
            system={system}
            onToggleModeration={(mediaId, moderated) =>
              moderateMutation.mutate({ mediaId, moderated })
            }
            onSelectHero={(mediaId) => heroMutation.mutate({ mediaId })}
            isUpdatingModeration={moderateMutation.isPending}
            isUpdatingHero={heroMutation.isPending}
          />
        ) : null}
        {activeTab === "taxonomy" ? (
          <TaxonomyTab
            system={system}
            onMapExternalTag={(input) => externalMappingMutation.mutate(input)}
            isMapping={externalMappingMutation.isPending}
          />
        ) : null}
        {activeTab === "crawl" ? (
          <CrawlTab
            events={system.crawlEvents}
            system={system}
            onRequestRecrawl={(source) => recrawlMutation.mutate({ source })}
            isRecrawlPending={recrawlMutation.isPending}
          />
        ) : null}
      </section>
    </div>
  );
}

function OverviewTab({
  system,
  onPublish,
  onToggleApproval,
  isPublishing,
  isApprovalPending,
}: {
  system: AdminGameSystemDetail;
  onPublish: (publish: boolean) => void;
  onToggleApproval: (approved: boolean) => void;
  isPublishing: boolean;
  isApprovalPending: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Publication status</CardTitle>
          <CardDescription>
            Track CMS approvals and public visibility. Actions become available once
            moderation tooling ships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StatusRow
            label="Published"
            value={system.isPublished ? "Published" : "Draft"}
            highlight={system.isPublished}
          />
          <StatusRow
            label="CMS approval"
            value={system.cmsApproved ? "Approved" : "Needs approval"}
            highlight={system.cmsApproved}
          />
          <StatusRow
            label="Summary source"
            value={system.summarySource ? system.summarySource.toUpperCase() : "Missing"}
            highlight={Boolean(system.hasSummary)}
          />
          <StatusRow
            label="Categories"
            value={String(system.categoryCount)}
            highlight={system.categoryCount > 0}
          />
          <StatusRow
            label="Unmoderated media"
            value={String(system.unmoderatedMediaCount)}
            highlight={system.unmoderatedMediaCount === 0}
          />
          <StatusRow
            label="Last approval"
            value={
              system.lastApprovedAt
                ? `${formatDateAndTime(system.lastApprovedAt)} (${formatRelativeTime(system.lastApprovedAt)})`
                : "Never"
            }
          />
        </CardContent>
        <CardFooter className="bg-muted/40 flex flex-wrap gap-2 border-t p-4">
          <Button
            type="button"
            size="sm"
            onClick={() => onPublish(!system.isPublished)}
            disabled={isPublishing || isApprovalPending}
            variant={system.isPublished ? "outline" : "default"}
          >
            {isPublishing
              ? "Saving…"
              : system.isPublished
                ? "Revert to draft"
                : "Publish system"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={system.cmsApproved ? "outline" : "default"}
            onClick={() => onToggleApproval(!system.cmsApproved)}
            disabled={isApprovalPending || isPublishing}
          >
            {isApprovalPending
              ? "Saving…"
              : system.cmsApproved
                ? "Revoke approval"
                : "Approve CMS copy"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crawl summary</CardTitle>
          <CardDescription>
            Monitor crawler outcomes and last successful enrichments before triggering a
            recrawl.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StatusRow
            label="Status"
            value={formatCrawlStatus(system.crawlStatus)}
            highlight={system.crawlStatus === "success"}
          />
          <StatusRow
            label="Last crawled"
            value={
              system.lastCrawledAt ? formatDateAndTime(system.lastCrawledAt) : "Never"
            }
          />
          <StatusRow
            label="Last success"
            value={
              system.lastSuccessAt ? formatDateAndTime(system.lastSuccessAt) : "Never"
            }
          />
          {system.errorMessage ? (
            <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2">
              <p className="text-xs font-medium tracking-wide uppercase">Last error</p>
              <p className="text-sm leading-snug">{system.errorMessage}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>External references</CardTitle>
          <CardDescription>
            Normalized IDs help cross-link crawlers and taxonomy mapping.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {renderExternalRefs(system)}
        </CardContent>
      </Card>
    </div>
  );
}

function ContentTab({ system }: { system: AdminGameSystemDetail }) {
  const hasCmsContent = Boolean(system.descriptionCms?.trim());
  const hasScrapedContent = Boolean(system.descriptionScraped?.trim());

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>CMS copy</CardTitle>
          <CardDescription>Manual synopsis authored by the content team.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {hasCmsContent ? system.descriptionCms : "CMS description not yet provided."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enriched description</CardTitle>
          <CardDescription>Latest crawler output available for review.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {hasScrapedContent
              ? system.descriptionScraped
              : "No crawler description captured."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source of truth</CardTitle>
          <CardDescription>Defines which upstream dataset wins merges.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-semibold">{system.sourceOfTruth ?? "Unset"}</p>
          <p className="text-muted-foreground mt-2">
            Adjust this setting when aligning manual content with the preferred crawler
            payload.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MediaTab({
  system,
  onToggleModeration,
  onSelectHero,
  isUpdatingModeration,
  isUpdatingHero,
}: {
  system: AdminGameSystemDetail;
  onToggleModeration: (mediaId: number, moderated: boolean) => void;
  onSelectHero: (mediaId: number) => void;
  isUpdatingModeration: boolean;
  isUpdatingHero: boolean;
}) {
  const hero = system.heroImage;

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Hero image</CardTitle>
          <CardDescription>
            Select the promotional image shown on public pages. Moderation tools arrive in
            the next iteration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hero ? (
            <div className="bg-muted/30 overflow-hidden rounded-lg border">
              <img
                src={hero.secureUrl}
                alt={`${system.name} hero artwork`}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <PlaceholderMessage message="No hero selected yet." />
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={hero && hero.moderated ? "secondary" : "outline"}>
              {hero && hero.moderated ? "Moderated" : "Needs review"}
            </Badge>
            <Badge variant="outline">{system.unmoderatedMediaCount} pending</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hero || isUpdatingModeration}
              onClick={() => hero && onToggleModeration(hero.id, !hero.moderated)}
            >
              {hero && hero.moderated ? "Mark as pending" : "Mark as reviewed"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled>
              Upload image (coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery assets</CardTitle>
          <CardDescription>
            Review scraped media before promoting to hero.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {system.gallery.length === 0 ? (
            <PlaceholderMessage message="Gallery is empty." />
          ) : (
            <ul className="space-y-2">
              {system.gallery.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      Asset #{asset.id}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {asset.secureUrl}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Badge variant={asset.moderated ? "secondary" : "outline"}>
                      {asset.moderated ? "Moderated" : "Needs review"}
                    </Badge>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingHero || system.heroImage?.id === asset.id}
                        onClick={() => onSelectHero(asset.id)}
                      >
                        {system.heroImage?.id === asset.id ? "Current hero" : "Set hero"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingModeration}
                        onClick={() => onToggleModeration(asset.id, !asset.moderated)}
                      >
                        {asset.moderated ? "Mark pending" : "Mark reviewed"}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaxonomyTab({
  system,
  onMapExternalTag,
  isMapping,
}: {
  system: AdminGameSystemDetail;
  onMapExternalTag: (input: ExternalMappingRequest) => void;
  isMapping: boolean;
}) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mechanicFilter, setMechanicFilter] = useState("");

  const filteredCategories = system.categories.filter((category) =>
    category.name.toLowerCase().includes(categoryFilter.toLowerCase()),
  );
  const filteredMechanics = system.mechanics.filter((mechanic) =>
    mechanic.name.toLowerCase().includes(mechanicFilter.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Canonical browse tags applied to this system.
              </CardDescription>
            </div>
            {system.categories.length > 0 ? (
              <Input
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                placeholder="Filter categories"
                className="w-full max-w-xs"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {system.categories.length === 0 ? (
            <PlaceholderMessage message="No categories assigned." />
          ) : filteredCategories.length === 0 ? (
            <PlaceholderMessage message="No categories match your filter." />
          ) : (
            <div className="grid gap-3">
              {filteredCategories.map((category) => (
                <CanonicalMappingCard
                  key={category.id}
                  type="category"
                  canonical={category}
                  mappings={system.categoryMappings[category.id] ?? []}
                  onSubmit={({ source, externalTag, confidence }) =>
                    onMapExternalTag({
                      targetType: "category",
                      targetId: category.id,
                      source,
                      externalTag,
                      confidence,
                    })
                  }
                  isPending={isMapping}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Mechanics</CardTitle>
              <CardDescription>
                Gameplay mechanics sourced from partner catalogs.
              </CardDescription>
            </div>
            {system.mechanics.length > 0 ? (
              <Input
                value={mechanicFilter}
                onChange={(event) => setMechanicFilter(event.target.value)}
                placeholder="Filter mechanics"
                className="w-full max-w-xs"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {system.mechanics.length === 0 ? (
            <PlaceholderMessage message="Mechanics pending mapping." />
          ) : filteredMechanics.length === 0 ? (
            <PlaceholderMessage message="No mechanics match your filter." />
          ) : (
            <div className="grid gap-3">
              {filteredMechanics.map((mechanic) => (
                <CanonicalMappingCard
                  key={mechanic.id}
                  type="mechanic"
                  canonical={mechanic}
                  mappings={system.mechanicMappings[mechanic.id] ?? []}
                  onSubmit={({ source, externalTag, confidence }) =>
                    onMapExternalTag({
                      targetType: "mechanic",
                      targetId: mechanic.id,
                      source,
                      externalTag,
                      confidence,
                    })
                  }
                  isPending={isMapping}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CanonicalMappingCard({
  type,
  canonical,
  mappings,
  onSubmit,
  isPending,
}: {
  type: "category" | "mechanic";
  canonical: GameSystemTag;
  mappings: AdminExternalTagMapping[];
  onSubmit: (input: {
    source: ExternalSourceOption;
    externalTag: string;
    confidence: number;
  }) => void;
  isPending: boolean;
}) {
  const [source, setSource] = useState<ExternalSourceOption>("startplaying");
  const [externalTag, setExternalTag] = useState("");
  const [confidence, setConfidence] = useState(100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTag = externalTag.trim();
    if (!trimmedTag) return;
    const normalizedConfidence = Math.min(100, Math.max(0, confidence)) / 100;
    onSubmit({ source, externalTag: trimmedTag, confidence: normalizedConfidence });
    setExternalTag("");
  };

  return (
    <Card className="bg-muted/40 border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {canonical.name}
          <span className="text-muted-foreground ml-2 text-xs tracking-wide uppercase">
            {type === "category" ? "Category" : "Mechanic"}
          </span>
        </CardTitle>
        {canonical.description ? (
          <CardDescription>{canonical.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {mappings.length === 0 ? (
          <PlaceholderMessage message="No external mappings yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {mappings.map((mapping) => (
              <Badge key={mapping.id} variant="outline" className="gap-1">
                <span className="text-muted-foreground/80 text-[10px] tracking-wide uppercase">
                  {mapping.source}
                </span>
                <span className="font-mono text-xs">{mapping.externalTag}</span>
                <span className="text-muted-foreground text-[10px]">
                  {mapping.confidence}%
                </span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
        >
          <Select
            value={source}
            onValueChange={(value: ExternalSourceOption) => setSource(value)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startplaying">StartPlaying</SelectItem>
              <SelectItem value="bgg">BoardGameGeek</SelectItem>
              <SelectItem value="wikipedia">Wikipedia</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={externalTag}
            onChange={(event) => setExternalTag(event.target.value)}
            placeholder="External tag"
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={confidence}
            onChange={(event) => {
              const value = Number(event.target.value);
              setConfidence(Number.isNaN(value) ? 0 : value);
            }}
            className="w-24"
            aria-label="Confidence (0-100)"
          />
          <Button type="submit" size="sm" disabled={isPending || !externalTag.trim()}>
            Add mapping
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function RecrawlControls({
  source,
  onSourceChange,
  onSubmit,
  isPending,
}: {
  source: RecrawlSourceOption;
  onSourceChange: (source: RecrawlSourceOption) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Select
        value={source}
        onValueChange={(value) => onSourceChange(value as RecrawlSourceOption)}
      >
        <SelectTrigger className="w-full min-w-[180px] sm:w-48">
          <SelectValue placeholder="Choose source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">Manual (no source)</SelectItem>
          <SelectItem value="startplaying">StartPlaying</SelectItem>
          <SelectItem value="bgg">BoardGameGeek</SelectItem>
          <SelectItem value="wikipedia">Wikipedia</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" size="sm" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Queueing…" : "Queue recrawl"}
      </Button>
    </div>
  );
}

function CrawlTab({
  events,
  system,
  onRequestRecrawl,
  isRecrawlPending,
}: {
  events: AdminGameSystemCrawlEvent[];
  system: AdminGameSystemDetail;
  onRequestRecrawl: (source: RecrawlSourceOption) => void;
  isRecrawlPending: boolean;
}) {
  const [source, setSource] = useState<RecrawlSourceOption>("manual");

  const handleRecrawl = () => {
    onRequestRecrawl(source);
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div>
            <CardTitle>Crawl history</CardTitle>
            <CardDescription>
              Trigger a recrawl from a specific source to populate history and refresh
              metadata.
            </CardDescription>
          </div>
          <RecrawlControls
            source={source}
            onSourceChange={setSource}
            onSubmit={handleRecrawl}
            isPending={isRecrawlPending}
          />
        </CardHeader>
        <CardContent>
          <PlaceholderMessage message="No crawl history recorded yet." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Crawl history</CardTitle>
            <CardDescription>
              Latest crawler executions for {system.name}.
            </CardDescription>
          </div>
          <RecrawlControls
            source={source}
            onSourceChange={setSource}
            onSubmit={handleRecrawl}
            isPending={isRecrawlPending}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>HTTP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium tracking-wide uppercase">
                  {event.source}
                </TableCell>
                <TableCell>
                  <Badge variant={event.status === "success" ? "secondary" : "outline"}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={event.severity === "info" ? "outline" : "destructive"}>
                    {event.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{formatDateAndTime(event.startedAt)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeTime(event.startedAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{formatDateAndTime(event.finishedAt)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeTime(event.finishedAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{event.httpStatus ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium",
          highlight ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PlaceholderMessage({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
      {message}
    </div>
  );
}

function renderExternalRefs(system: AdminGameSystemDetail) {
  const refs = system.externalRefs ?? {};
  const entries = Object.entries(refs);

  if (entries.length === 0) {
    return <PlaceholderMessage message="No external references captured." />;
  }

  return entries.map(([key, value]) => (
    <Fragment key={key}>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">{key}</span>
      <span className="font-mono text-sm">{value}</span>
    </Fragment>
  ));
}

function formatCrawlStatus(status: string | null) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatRelativeTime(isoString: string | null | undefined) {
  if (!isoString) return "unknown";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "invalid date";
  const deltaMs = Date.now() - date.getTime();
  const deltaSeconds = Math.round(deltaMs / 1000);
  if (Math.abs(deltaSeconds) < 60) return "just now";
  const divisions = [
    { amount: 60, unit: "minute" },
    { amount: 60, unit: "hour" },
    { amount: 24, unit: "day" },
    { amount: 7, unit: "week" },
    { amount: 4.348, unit: "month" },
    { amount: 12, unit: "year" },
  ] as const;

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let duration = deltaSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) break;
    duration /= division.amount;
    unit = division.unit as Intl.RelativeTimeFormatUnit;
  }

  return formatter.format(Math.round(duration * -1), unit);
}

export const ADMIN_SYSTEM_EDITOR_TABS = TABS;
