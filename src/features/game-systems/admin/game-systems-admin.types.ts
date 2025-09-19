import type { ExternalRefs } from "~/db/schema/game-systems.schema";
import type { GameSystemMediaAsset, GameSystemTag } from "../game-systems.types";

export type AdminSystemStatusFilter =
  | "all"
  | "needs_curation"
  | "errors"
  | "published"
  | "unpublished";

export type AdminSystemSortOption = "updated-desc" | "name-asc" | "crawl-status";

export type AdminSystemStatusFlag =
  | "missing-summary"
  | "missing-hero"
  | "hero-unmoderated"
  | "taxonomy-empty"
  | "cms-unapproved"
  | "unpublished"
  | "unmoderated-media"
  | "crawl-partial";

export interface AdminGameSystemListItem {
  id: number;
  name: string;
  slug: string;
  isPublished: boolean;
  cmsApproved: boolean;
  crawlStatus: string | null;
  lastCrawledAt: string | null;
  lastSuccessAt: string | null;
  updatedAt: string;
  heroSelected: boolean;
  heroModerated: boolean;
  hasSummary: boolean;
  summarySource: "cms" | "scraped" | null;
  categoryCount: number;
  unmoderatedMediaCount: number;
  needsCuration: boolean;
  hasErrors: boolean;
  statusFlags: AdminSystemStatusFlag[];
  errorMessage: string | null;
}

export interface AdminGameSystemListStats {
  total: number;
  needsCuration: number;
  errors: number;
  published: number;
}

export interface AdminGameSystemListResponse {
  items: AdminGameSystemListItem[];
  total: number;
  stats: AdminGameSystemListStats;
}

export interface AdminGameSystemCrawlEvent {
  id: number;
  source: string;
  status: string;
  severity: string;
  startedAt: string;
  finishedAt: string;
  httpStatus: number | null;
  errorMessage: string | null;
  details: Record<string, Record<string, never>> | null;
}

export interface AdminExternalTagMapping {
  id: number;
  source: string;
  externalTag: string;
  confidence: number;
}

export interface AdminGameSystemDetail extends AdminGameSystemListItem {
  descriptionCms: string | null;
  descriptionScraped: string | null;
  externalRefs: ExternalRefs | null;
  sourceOfTruth: string | null;
  lastApprovedAt: string | null;
  lastApprovedBy: string | null;
  heroImage: GameSystemMediaAsset | null;
  gallery: GameSystemMediaAsset[];
  categories: GameSystemTag[];
  mechanics: GameSystemTag[];
  crawlEvents: AdminGameSystemCrawlEvent[];
  categoryMappings: Record<number, AdminExternalTagMapping[]>;
  mechanicMappings: Record<number, AdminExternalTagMapping[]>;
}
