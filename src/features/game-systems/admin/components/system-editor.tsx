import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent } from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import {
  mapExternalTag,
  moderateImage,
  selectHeroImage,
  triggerRecrawl,
  updateCmsApproval,
  updatePublishStatus,
  upsertCmsContent,
} from "~/features/game-systems/game-systems.mutations";
import type { GameSystemTag } from "~/features/game-systems/game-systems.types";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
import { CloudinaryImage } from "~/shared/components/cloudinary-image";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { getAdminGameSystem } from "../game-systems-admin.queries";
import type {
  AdminExternalTagMapping,
  AdminGameSystemCrawlEvent,
  AdminGameSystemDetail,
} from "../game-systems-admin.types";
import {
  formatSystemCrawlStatus,
  formatSystemRelativeTime,
} from "../lib/system-formatters";
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

function createTabs(t: (key: string) => string) {
  return [
    { value: "overview", label: t("admin.editor.tabs.overview") },
    { value: "content", label: t("admin.editor.tabs.content") },
    { value: "media", label: t("admin.editor.tabs.media") },
    { value: "taxonomy", label: t("admin.editor.tabs.taxonomy") },
    { value: "crawl", label: t("admin.editor.tabs.crawl") },
  ] as const;
}

export type AdminSystemEditorTab = ReturnType<typeof createTabs>[number]["value"];

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
  const { t } = useGameSystemsTranslation();
  const queryClient = useQueryClient();
  const updatedRelative = formatSystemRelativeTime(system.updatedAt, { t });
  const tabs = createTabs(t);
  const statusPills =
    system.statusFlags.length === 0 ? (
      <Badge variant="secondary">{t("admin.editor.status.publish_ready")}</Badge>
    ) : (
      system.statusFlags.map((flag) => <SystemStatusPill key={flag} flag={flag} />)
    );

  const refreshSystem = useCallback(async () => {
    const next = await getAdminGameSystem({ data: { systemId: system.id } });
    if (!next) {
      throw new Error(t("admin.editor.hardcoded_strings.system_not_found_after_update"));
    }
    onSystemChange(next);
    await queryClient.invalidateQueries({ queryKey: ["admin-game-systems"] });
    return next;
  }, [system.id, onSystemChange, queryClient, t]);

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
      toast.success(t("admin.editor.messages.media_moderation_updated"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.errors.failed_to_update_moderation");
      toast.error(message);
    },
  });

  const heroMutation = useMutation({
    mutationFn: async ({ mediaId }: { mediaId: number }) => {
      await selectHeroImage({ data: { systemId: system.id, mediaId } });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success(t("admin.editor.messages.hero_image_updated"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.errors.failed_to_update_hero_image");
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
      toast.success(t("admin.editor.hardcoded_strings.external_tag_mapped"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.editor.hardcoded_strings.failed_to_map_tag");
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
      toast.success(t("admin.editor.hardcoded_strings.recrawl_queued"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.editor.hardcoded_strings.failed_to_queue_recrawl");
      toast.error(message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      await updatePublishStatus({ data: { systemId: system.id, isPublished: publish } });
      return refreshSystem();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.publish
          ? t("admin.editor.hardcoded_strings.system_published")
          : t("admin.editor.hardcoded_strings.system_reverted_to_draft"),
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.editor.hardcoded_strings.failed_to_update_publish_status");
      toast.error(message);
    },
  });

  const cmsApprovalMutation = useMutation({
    mutationFn: async ({ approved }: { approved: boolean }) => {
      await updateCmsApproval({ data: { systemId: system.id, approved } });
      return refreshSystem();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.approved
          ? t("admin.editor.hardcoded_strings.cms_copy_approved")
          : t("admin.editor.hardcoded_strings.cms_approval_revoked"),
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.editor.hardcoded_strings.failed_to_update_cms_approval");
      toast.error(message);
    },
  });

  const cmsContentMutation = useMutation({
    mutationFn: async (payload: {
      description?: string;
      faqs?: { question: string; answer: string }[];
    }) => {
      await upsertCmsContent({
        data: {
          systemId: system.id,
          ...payload,
        },
      });
      return refreshSystem();
    },
    onSuccess: () => {
      toast.success(t("admin.editor.hardcoded_strings.cms_content_saved"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.editor.hardcoded_strings.failed_to_save_cms_content");
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
              {t("admin.editor.hardcoded_strings.last_updated_relative", {
                relative: updatedRelative,
                slug: system.slug,
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs tracking-wide uppercase">
            {statusPills}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/40 flex flex-wrap gap-2 border-t p-4">
          {tabs.map((tab) => {
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
            t={t}
          />
        ) : null}
        {activeTab === "content" ? (
          <ContentTab
            system={system}
            onSave={(payload) => cmsContentMutation.mutate(payload)}
            isSaving={cmsContentMutation.isPending}
            t={t}
          />
        ) : null}
        {activeTab === "media" ? (
          <MediaTab
            system={system}
            onToggleModeration={(mediaId, moderated) =>
              moderateMutation.mutate({ mediaId, moderated })
            }
            onSelectHero={(mediaId) => heroMutation.mutate({ mediaId })}
            isUpdatingModeration={moderateMutation.isPending}
            isUpdatingHero={heroMutation.isPending}
            t={t}
          />
        ) : null}
        {activeTab === "taxonomy" ? (
          <TaxonomyTab
            system={system}
            onMapExternalTag={(input) => externalMappingMutation.mutate(input)}
            isMapping={externalMappingMutation.isPending}
            t={t}
          />
        ) : null}
        {activeTab === "crawl" ? (
          <CrawlTab
            events={system.crawlEvents}
            system={system}
            onRequestRecrawl={(source) => recrawlMutation.mutate({ source })}
            isRecrawlPending={recrawlMutation.isPending}
            t={t}
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
  t,
}: {
  system: AdminGameSystemDetail;
  onPublish: (publish: boolean) => void;
  onToggleApproval: (approved: boolean) => void;
  isPublishing: boolean;
  isApprovalPending: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.editor.hardcoded_strings.publication_status")}</CardTitle>
          <CardDescription>
            {t(
              "admin.editor.hardcoded_strings.track_cms_approvals_and_public_visibility",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StatusRow
            label={t("admin.editor.hardcoded_strings.published")}
            value={
              system.isPublished
                ? t("admin.editor.hardcoded_strings.published")
                : t("admin.editor.hardcoded_strings.draft")
            }
            highlight={system.isPublished}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.cms_approval")}
            value={
              system.cmsApproved
                ? t("admin.editor.hardcoded_strings.approved")
                : t("admin.editor.hardcoded_strings.needs_approval")
            }
            highlight={system.cmsApproved}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.summary_source")}
            value={
              system.summarySource
                ? system.summarySource.toUpperCase()
                : t("admin.editor.hardcoded_strings.missing")
            }
            highlight={Boolean(system.hasSummary)}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.categories")}
            value={String(system.categoryCount)}
            highlight={system.categoryCount > 0}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.unmoderated_media")}
            value={String(system.unmoderatedMediaCount)}
            highlight={system.unmoderatedMediaCount === 0}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.last_approval")}
            value={
              system.lastApprovedAt
                ? `${formatDateAndTime(system.lastApprovedAt)} (${formatSystemRelativeTime(system.lastApprovedAt, { t })})`
                : t("admin.editor.hardcoded_strings.never")
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
              ? t("admin.editor.hardcoded_strings.saving")
              : system.isPublished
                ? t("admin.editor.hardcoded_strings.revert_to_draft")
                : t("admin.editor.hardcoded_strings.publish_system")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={system.cmsApproved ? "outline" : "default"}
            onClick={() => onToggleApproval(!system.cmsApproved)}
            disabled={isApprovalPending || isPublishing}
          >
            {isApprovalPending
              ? t("admin.editor.hardcoded_strings.saving")
              : system.cmsApproved
                ? t("admin.editor.hardcoded_strings.revoke_approval")
                : t("admin.editor.hardcoded_strings.approve_cms_copy")}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.editor.hardcoded_strings.crawl_summary")}</CardTitle>
          <CardDescription>
            {t("admin.editor.hardcoded_strings.monitor_crawler_outcomes")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StatusRow
            label={t("admin.editor.hardcoded_strings.status")}
            value={formatSystemCrawlStatus(system.crawlStatus, t)}
            highlight={system.crawlStatus === "success"}
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.last_crawled")}
            value={
              system.lastCrawledAt
                ? formatDateAndTime(system.lastCrawledAt)
                : t("admin.editor.hardcoded_strings.never_crawled")
            }
          />
          <StatusRow
            label={t("admin.editor.hardcoded_strings.last_success")}
            value={
              system.lastSuccessAt
                ? formatDateAndTime(system.lastSuccessAt)
                : t("admin.editor.hardcoded_strings.never_crawled")
            }
          />
          {system.errorMessage ? (
            <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2">
              <p className="text-xs font-medium tracking-wide uppercase">
                {t("admin.editor.hardcoded_strings.last_error")}
              </p>
              <p className="text-sm leading-snug">{system.errorMessage}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("admin.editor.hardcoded_strings.external_references")}</CardTitle>
          <CardDescription>
            {t("admin.editor.hardcoded_strings.normalized_ids_help_cross_link")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {renderExternalRefs(system, t)}
        </CardContent>
      </Card>
    </div>
  );
}

type EditableFaq = {
  key: string;
  id: number | null;
  question: string;
  answer: string;
};

type SanitizedFaq = {
  question: string;
  answer: string;
};

const mapCmsFaqsToEditable = (faqs: AdminGameSystemDetail["cmsFaqs"]): EditableFaq[] =>
  faqs.map((faq) => ({
    key: `cms-${faq.id}`,
    id: faq.id ?? null,
    question: faq.question,
    answer: faq.answer,
  }));

const sanitizeEditableFaqs = (faqs: EditableFaq[]): SanitizedFaq[] =>
  faqs
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);

const sanitizeFaqList = (faqs: AdminGameSystemDetail["cmsFaqs"]): SanitizedFaq[] =>
  faqs
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);

const areSanitizedFaqsEqual = (a: SanitizedFaq[], b: SanitizedFaq[]) => {
  if (a.length !== b.length) return false;
  return a.every(
    (faq, index) =>
      faq.question === b[index]?.question && faq.answer === b[index]?.answer,
  );
};

function ContentTab({
  system,
  onSave,
  isSaving,
  t,
}: {
  system: AdminGameSystemDetail;
  onSave: (input: {
    description?: string;
    faqs?: { question: string; answer: string }[];
  }) => void;
  isSaving: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [description, setDescription] = useState(system.descriptionCms ?? "");
  const [faqDrafts, setFaqDrafts] = useState<EditableFaq[]>(() =>
    mapCmsFaqsToEditable(system.cmsFaqs),
  );
  const nextFaqKeyRef = useRef(0);

  const resetState = useCallback(() => {
    setDescription(system.descriptionCms ?? "");
    setFaqDrafts(mapCmsFaqsToEditable(system.cmsFaqs));
    nextFaqKeyRef.current = 0;
  }, [system.cmsFaqs, system.descriptionCms]);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setDescription(system.descriptionCms ?? "");
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFaqDrafts(mapCmsFaqsToEditable(system.cmsFaqs));
    nextFaqKeyRef.current = 0;
  }, [system.cmsFaqs, system.descriptionCms, system.id]);

  const allocateKey = useCallback(() => {
    const key = `draft-${nextFaqKeyRef.current}`;
    nextFaqKeyRef.current += 1;
    return key;
  }, []);

  const normalizedDescription = description.trim();
  const normalizedInitialDescription = (system.descriptionCms ?? "").trim();
  const sanitizedDraftFaqs = useMemo(() => sanitizeEditableFaqs(faqDrafts), [faqDrafts]);
  const sanitizedInitialFaqs = useMemo(
    () => sanitizeFaqList(system.cmsFaqs),
    [system.cmsFaqs],
  );

  const descriptionChanged = normalizedDescription !== normalizedInitialDescription;
  const faqsChanged = !areSanitizedFaqsEqual(sanitizedDraftFaqs, sanitizedInitialFaqs);
  const hasIncompleteFaq = faqDrafts.some((faq) => {
    const hasQuestion = faq.question.trim().length > 0;
    const hasAnswer = faq.answer.trim().length > 0;
    return hasQuestion !== hasAnswer;
  });
  const isDirty = descriptionChanged || faqsChanged;
  const canSave = isDirty && !hasIncompleteFaq && !isSaving;
  const hasScrapedContent = Boolean(system.descriptionScraped?.trim());

  const handleSave = () => {
    if (!descriptionChanged && !faqsChanged) return;
    const payload: {
      description?: string;
      faqs?: { question: string; answer: string }[];
    } = {};
    if (descriptionChanged) {
      payload.description = normalizedDescription;
    }
    if (faqsChanged) {
      payload.faqs = sanitizedDraftFaqs;
    }
    if (Object.keys(payload).length === 0) return;
    onSave(payload);
  };

  const handleReset = () => {
    resetState();
  };

  const handleAddFaq = () => {
    setFaqDrafts((previous) => [
      ...previous,
      { key: allocateKey(), id: null, question: "", answer: "" },
    ]);
  };

  const handleRemoveFaq = (key: string) => {
    setFaqDrafts((previous) => previous.filter((faq) => faq.key !== key));
  };

  const handleFaqChange = (key: string, field: "question" | "answer", value: string) => {
    setFaqDrafts((previous) =>
      previous.map((faq) =>
        faq.key === key
          ? {
              ...faq,
              [field]: value,
            }
          : faq,
      ),
    );
  };

  const handleCopyScrapedDescription = () => {
    if (!system.descriptionScraped) return;
    setDescription(system.descriptionScraped);
    toast.success(t("admin.editor.messages.scraped_description_copied_to_cms"));
  };

  const handleCopyScrapedFaq = (faq: AdminGameSystemDetail["scrapedFaqs"][number]) => {
    setFaqDrafts((previous) => {
      const sanitizedExisting = sanitizeEditableFaqs(previous);
      const question = faq.question.trim();
      const answer = faq.answer.trim();
      const alreadyExists = sanitizedExisting.some(
        (entry) => entry.question === question && entry.answer === answer,
      );
      if (alreadyExists) {
        toast.info(t("admin.editor.messages.faq_already_present_in_cms_overrides"));
        return previous;
      }
      return [
        ...previous,
        { key: allocateKey(), id: null, question: faq.question, answer: faq.answer },
      ];
    });
  };

  const handleCopyAllScrapedFaqs = () => {
    if (system.scrapedFaqs.length === 0) return;
    nextFaqKeyRef.current = 0;
    setFaqDrafts(() =>
      system.scrapedFaqs.map((faq) => ({
        key: allocateKey(),
        id: null,
        question: faq.question,
        answer: faq.answer,
      })),
    );
    toast.success(t("admin.editor.messages.scraped_faqs_copied_to_cms"));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.editor.hardcoded_strings.cms_copy_title")}</CardTitle>
            <CardDescription>
              {t(
                "admin.editor.hardcoded_strings.manual_synopsis_authored_by_content_team",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-description">
                {t("admin.editor.hardcoded_strings.cms_description")}
              </Label>
              <Textarea
                id="cms-description"
                value={description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(event.target.value)
                }
                rows={10}
                placeholder={t(
                  "admin.editor.hardcoded_strings.craft_narrative_players_should_see",
                )}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("admin.editor.hardcoded_strings.saving_overrides_crawler_copy")}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/40 flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-xs">
              {hasIncompleteFaq
                ? t("admin.editor.hardcoded_strings.complete_both_question_and_answer")
                : isDirty
                  ? t(
                      "admin.editor.hardcoded_strings.unsaved_changes_will_replace_cms_overrides",
                    )
                  : t("admin.editor.hardcoded_strings.no_cms_changes_to_save")}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!isDirty || isSaving}
              >
                {t("admin.editor.hardcoded_strings.reset")}
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={!canSave}>
                {isSaving
                  ? t("admin.editor.hardcoded_strings.saving")
                  : t("admin.editor.hardcoded_strings.save_cms_content")}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{t("admin.editor.sections.cms_faqs")}</CardTitle>
              <CardDescription>{t("admin.editor.descriptions.cms_faqs")}</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleAddFaq}>
              {t("admin.editor.actions.add_faq")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqDrafts.length === 0 ? (
              <PlaceholderMessage message={t("admin.editor.messages.no_cms_faqs_yet")} />
            ) : (
              <div className="space-y-3">
                {faqDrafts.map((faq, index) => (
                  <div
                    key={faq.key}
                    className="bg-muted/40 space-y-3 rounded-md border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {t("admin.editor.hardcoded_strings.faq_number", {
                          number: index + 1,
                        })}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveFaq(faq.key)}
                      >
                        {t("admin.editor.actions.remove")}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`faq-question-${faq.key}`}>
                        {t("admin.editor.labels.question")}
                      </Label>
                      <Input
                        id={`faq-question-${faq.key}`}
                        value={faq.question}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleFaqChange(faq.key, "question", event.target.value)
                        }
                        placeholder={t(
                          "admin.editor.placeholders.what_should_players_ask",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`faq-answer-${faq.key}`}>
                        {t("admin.editor.labels.answer")}
                      </Label>
                      <Textarea
                        id={`faq-answer-${faq.key}`}
                        value={faq.answer}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          handleFaqChange(faq.key, "answer", event.target.value)
                        }
                        rows={4}
                        placeholder={t(
                          "admin.editor.placeholders.provide_curated_response",
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{t("admin.editor.sections.enriched_description")}</CardTitle>
              <CardDescription>
                {t("admin.editor.descriptions.enriched_description")}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyScrapedDescription}
              disabled={!hasScrapedContent}
            >
              {t("admin.editor.actions.copy_to_cms")}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {hasScrapedContent
                ? system.descriptionScraped
                : t("admin.editor.messages.no_crawler_description")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{t("admin.editor.sections.scraped_faqs")}</CardTitle>
              <CardDescription>
                {t("admin.editor.descriptions.scraped_faqs")}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyAllScrapedFaqs}
              disabled={system.scrapedFaqs.length === 0}
            >
              {t("admin.editor.actions.copy_all_to_cms")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {system.scrapedFaqs.length === 0 ? (
              <PlaceholderMessage
                message={t("admin.editor.messages.no_scraped_faqs_available")}
              />
            ) : (
              <div className="space-y-3">
                {system.scrapedFaqs.map((faq) => (
                  <div
                    key={faq.id ?? faq.question}
                    className="space-y-2 rounded-md border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="leading-snug font-semibold">{faq.question}</p>
                        {faq.source ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] tracking-wide uppercase"
                          >
                            {faq.source}
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyScrapedFaq(faq)}
                      >
                        {t("common.buttons.copy")}
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.editor.sections.source_of_truth")}</CardTitle>
            <CardDescription>
              {t("admin.editor.descriptions.source_of_truth")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-semibold">
              {system.sourceOfTruth ??
                t("admin.editor.dialog_labels.source_of_truth_unset")}
            </p>
            <p className="text-muted-foreground mt-2">
              {t("admin.editor.descriptions.source_of_truth_adjustment")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MediaTab({
  system,
  onToggleModeration,
  onSelectHero,
  isUpdatingModeration,
  isUpdatingHero,
  t,
}: {
  system: AdminGameSystemDetail;
  onToggleModeration: (mediaId: number, moderated: boolean) => void;
  onSelectHero: (mediaId: number) => void;
  isUpdatingModeration: boolean;
  isUpdatingHero: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const hero = system.heroImage;

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.editor.sections.hero_image")}</CardTitle>
          <CardDescription>{t("admin.editor.descriptions.hero_image")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hero ? (
            <div className="bg-muted/30 overflow-hidden rounded-lg border">
              <CloudinaryImage
                imageUrl={hero.secureUrl}
                transform={{ width: 1200, height: 600 }}
                alt={t("admin.editor.aria_labels.hero_artwork", {
                  systemName: system.name,
                })}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <PlaceholderMessage
              message={t("admin.editor.messages.no_hero_selected_yet")}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={hero && hero.moderated ? "secondary" : "outline"}>
              {hero && hero.moderated
                ? t("admin.editor.labels.moderated")
                : t("admin.editor.labels.needs_review")}
            </Badge>
            <Badge variant="outline">
              {system.unmoderatedMediaCount} {t("admin.editor.labels.pending")}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hero || isUpdatingModeration}
              onClick={() => hero && onToggleModeration(hero.id, !hero.moderated)}
            >
              {hero && hero.moderated
                ? t("admin.editor.actions.mark_as_pending")
                : t("admin.editor.actions.mark_as_reviewed")}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled>
              {t("admin.editor.actions.upload_image")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.editor.sections.gallery_assets")}</CardTitle>
          <CardDescription>
            {t("admin.editor.descriptions.gallery_assets")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {system.gallery.length === 0 ? (
            <PlaceholderMessage message={t("admin.editor.messages.gallery_is_empty")} />
          ) : (
            <ul className="space-y-2">
              {system.gallery.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {t("admin.editor.labels.asset_number", { id: asset.id })}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {asset.secureUrl}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Badge variant={asset.moderated ? "secondary" : "outline"}>
                      {asset.moderated
                        ? t("admin.editor.labels.moderated")
                        : t("admin.editor.labels.needs_review")}
                    </Badge>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingHero || system.heroImage?.id === asset.id}
                        onClick={() => onSelectHero(asset.id)}
                      >
                        {system.heroImage?.id === asset.id
                          ? t("admin.editor.actions.current_hero")
                          : t("admin.editor.actions.set_hero")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingModeration}
                        onClick={() => onToggleModeration(asset.id, !asset.moderated)}
                      >
                        {asset.moderated
                          ? t("admin.editor.actions.mark_pending")
                          : t("admin.editor.actions.mark_reviewed")}
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
  t,
}: {
  system: AdminGameSystemDetail;
  onMapExternalTag: (input: ExternalMappingRequest) => void;
  isMapping: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
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
              <CardTitle>{t("admin.editor.sections.categories")}</CardTitle>
              <CardDescription>
                {t("admin.editor.descriptions.categories")}
              </CardDescription>
            </div>
            {system.categories.length > 0 ? (
              <Input
                value={categoryFilter}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setCategoryFilter(event.target.value)
                }
                placeholder={t("admin.editor.placeholders.filter_categories")}
                className="w-full max-w-xs"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {system.categories.length === 0 ? (
            <PlaceholderMessage
              message={t("admin.editor.messages.no_categories_assigned")}
            />
          ) : filteredCategories.length === 0 ? (
            <PlaceholderMessage
              message={t("admin.editor.messages.no_categories_match_filter")}
            />
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
                  t={t}
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
              <CardTitle>{t("admin.editor.sections.mechanics")}</CardTitle>
              <CardDescription>
                {t("admin.editor.descriptions.mechanics")}
              </CardDescription>
            </div>
            {system.mechanics.length > 0 ? (
              <Input
                value={mechanicFilter}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setMechanicFilter(event.target.value)
                }
                placeholder={t("admin.editor.placeholders.filter_mechanics")}
                className="w-full max-w-xs"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {system.mechanics.length === 0 ? (
            <PlaceholderMessage
              message={t("admin.editor.messages.mechanics_pending_mapping")}
            />
          ) : filteredMechanics.length === 0 ? (
            <PlaceholderMessage
              message={t("admin.editor.messages.no_mechanics_match_filter")}
            />
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
                  t={t}
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
  t,
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
  t: (key: string, options?: Record<string, unknown>) => string;
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
            {t(`admin.editor.taxonomy.${type}`)}
          </span>
        </CardTitle>
        {canonical.description ? (
          <CardDescription>{canonical.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {mappings.length === 0 ? (
          <PlaceholderMessage
            message={t("admin.editor.messages.no_external_mappings_yet")}
          />
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
              <SelectValue placeholder={t("admin.editor.labels.source")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startplaying">
                {t("admin.editor.sources.startplaying")}
              </SelectItem>
              <SelectItem value="bgg">{t("admin.editor.sources.bgg")}</SelectItem>
              <SelectItem value="wikipedia">
                {t("admin.editor.sources.wikipedia")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={externalTag}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setExternalTag(event.target.value)
            }
            placeholder={t("admin.editor.placeholders.external_tag")}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={confidence}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const value = Number(event.target.value);
              setConfidence(Number.isNaN(value) ? 0 : value);
            }}
            className="w-24"
            aria-label={t("admin.editor.dialog_labels.confidence_0_100")}
          />
          <Button type="submit" size="sm" disabled={isPending || !externalTag.trim()}>
            {t("admin.editor.actions.add_mapping")}
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
  t,
}: {
  source: RecrawlSourceOption;
  onSourceChange: (source: RecrawlSourceOption) => void;
  onSubmit: () => void;
  isPending: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Select
        value={source}
        onValueChange={(value) => onSourceChange(value as RecrawlSourceOption)}
      >
        <SelectTrigger className="w-full min-w-[180px] sm:w-48">
          <SelectValue placeholder={t("admin.editor.placeholders.choose_source")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">{t("admin.editor.sources.manual")}</SelectItem>
          <SelectItem value="startplaying">
            {t("admin.editor.sources.startplaying")}
          </SelectItem>
          <SelectItem value="bgg">{t("admin.editor.sources.bgg")}</SelectItem>
          <SelectItem value="wikipedia">{t("admin.editor.sources.wikipedia")}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" size="sm" onClick={onSubmit} disabled={isPending}>
        {isPending
          ? t("admin.editor.actions.queueing")
          : t("admin.editor.actions.queue_recrawl")}
      </Button>
    </div>
  );
}

function CrawlTab({
  events,
  system,
  onRequestRecrawl,
  isRecrawlPending,
  t,
}: {
  events: AdminGameSystemCrawlEvent[];
  system: AdminGameSystemDetail;
  onRequestRecrawl: (source: RecrawlSourceOption) => void;
  isRecrawlPending: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
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
            <CardTitle>{t("admin.editor.sections.crawl_history")}</CardTitle>
            <CardDescription>
              {t("admin.editor.descriptions.crawl_history")}
            </CardDescription>
          </div>
          <RecrawlControls
            source={source}
            onSourceChange={setSource}
            onSubmit={handleRecrawl}
            isPending={isRecrawlPending}
            t={t}
          />
        </CardHeader>
        <CardContent>
          <PlaceholderMessage message={t("admin.editor.messages.no_crawl_history")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("admin.editor.sections.crawl_history")}</CardTitle>
            <CardDescription>
              {t("admin.editor.messages.latest_crawler_executions", {
                systemName: system.name,
              })}
            </CardDescription>
          </div>
          <RecrawlControls
            source={source}
            onSourceChange={setSource}
            onSubmit={handleRecrawl}
            isPending={isRecrawlPending}
            t={t}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.editor.labels.source")}</TableHead>
              <TableHead>{t("admin.editor.labels.status")}</TableHead>
              <TableHead>{t("admin.editor.labels.severity")}</TableHead>
              <TableHead>{t("admin.editor.labels.started")}</TableHead>
              <TableHead>{t("admin.editor.labels.finished")}</TableHead>
              <TableHead>{t("admin.editor.labels.http")}</TableHead>
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
                      {formatSystemRelativeTime(event.startedAt, { t })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{formatDateAndTime(event.finishedAt)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatSystemRelativeTime(event.finishedAt, { t })}
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

function renderExternalRefs(system: AdminGameSystemDetail, t: (key: string) => string) {
  const refs = system.externalRefs ?? {};
  const entries = Object.entries(refs);

  if (entries.length === 0) {
    return (
      <PlaceholderMessage
        message={t("admin.editor.hardcoded_strings.no_external_references")}
      />
    );
  }

  return entries.map(([key, value]) => (
    <Fragment key={key}>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">{key}</span>
      <span className="font-mono text-sm">{value}</span>
    </Fragment>
  ));
}

export const ADMIN_SYSTEM_EDITOR_TABS = createTabs(() => "");
