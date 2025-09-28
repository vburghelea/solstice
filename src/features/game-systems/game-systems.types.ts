import type { Faq } from "~/db/schema/faqs.schema";
import type { ExternalRefs } from "~/db/schema/game-systems.schema";

export interface GameSystemTag {
  id: number;
  name: string;
  description: string | null;
}

export interface GameSystemMediaAsset {
  id: number;
  secureUrl: string;
  kind: string | null;
  orderIndex: number | null;
  license: string | null;
  licenseUrl: string | null;
  width: number | null;
  height: number | null;
  moderated: boolean;
}

export interface GameSystemPublisherInfo {
  id: number;
  name: string;
  websiteUrl: string | null;
  verified: boolean;
}

export type GameSystemFaq = Faq;

export interface GameSystemCategoryOption {
  id: number;
  name: string;
  description: string | null;
}

export interface GameSystemCategoryTag {
  id: number;
  name: string;
}

export interface GameSystemListItem {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  heroUrl: string | null;
  heroImage: GameSystemMediaAsset | null;
  categories: GameSystemTag[];
  mechanics: GameSystemTag[];
  minPlayers: number | null;
  maxPlayers: number | null;
  optimalPlayers: number | null;
  averagePlayTime: number | null;
  publisher: GameSystemPublisherInfo | null;
  yearReleased: number | null;
  releaseDate: string | null;
}

export interface AvailableGameSystemFilters {
  categories: GameSystemTag[];
}

export interface GameSystemListResult {
  items: GameSystemListItem[];
  page: number;
  perPage: number;
  total: number;
  availableFilters: AvailableGameSystemFilters;
}

export interface GameSystemDetail extends GameSystemListItem {
  description: string | null;
  descriptionCms: string | null;
  descriptionScraped: string | null;
  externalRefs: ExternalRefs | null;
  gallery: GameSystemMediaAsset[];
  faqs: GameSystemFaq[];
  ageRating: string | null;
  complexityRating: string | null;
}

export interface PopularGameSystem {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  heroUrl: string | null;
  gameCount: number;
}
